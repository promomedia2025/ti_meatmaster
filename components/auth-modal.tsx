"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect } from "react";
import React from "react";
import Link from "next/link";
import { toast } from "sonner";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "login" | "register";
}

type AuthMode = "login" | "register";

export function AuthModal({ isOpen, onClose, mode = "login" }: AuthModalProps) {
  const { login, register, isLoading } = useAuth();
  const [currentMode, setCurrentMode] = useState<AuthMode>(mode);

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  // Registration fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [telephone, setTelephone] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP verification state
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [otpError, setOtpError] = useState("");

  // Validation Helpers
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPhone = (phone: string) => {
    // Check if it has exactly 10 digits (handling +30 or spaces)
    const digits = phone.replace(/\D/g, "");
    return digits.length === 10;
  };

  // Update current mode when prop changes
  React.useEffect(() => {
    setCurrentMode(mode);
    setError(""); // Clear errors on mode switch
  }, [mode]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    // --- Login Validation ---
    if (!email.trim()) {
      setError("Παρακαλώ εισάγετε το email σας");
      setIsSubmitting(false);
      return;
    }

    if (!isValidEmail(email)) {
      setError("Μη έγκυρη μορφή email");
      setIsSubmitting(false);
      return;
    }

    if (!password) {
      setError("Παρακαλώ εισάγετε τον κωδικό πρόσβασης");
      setIsSubmitting(false);
      return;
    }
    // ------------------------

    try {
      const result = await login(email, password, remember);
      if (result.success) {
        onClose();
        resetForm();
      } else {
        setError(result.error || "Η σύνδεση απέτυχε");
      }
    } catch (error) {
      setError("Παρουσιάστηκε απροσδόκητο σφάλμα");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    // --- Register Validation ---
    if (!firstName.trim()) {
      setError("Το όνομα είναι υποχρεωτικό");
      setIsSubmitting(false);
      return;
    }

    if (!lastName.trim()) {
      setError("Το επώνυμο είναι υποχρεωτικό");
      setIsSubmitting(false);
      return;
    }

    if (!registerEmail.trim()) {
      setError("Το email είναι υποχρεωτικό");
      setIsSubmitting(false);
      return;
    }

    if (!isValidEmail(registerEmail)) {
      setError("Μη έγκυρη μορφή email");
      setIsSubmitting(false);
      return;
    }

    if (!telephone.trim()) {
      setError("Το τηλέφωνο είναι υποχρεωτικό");
      setIsSubmitting(false);
      return;
    }

    if (!isValidPhone(telephone)) {
      setError("Παρακαλώ εισάγετε έγκυρο αριθμό τηλεφώνου (10 ψηφία)");
      setIsSubmitting(false);
      return;
    }

    if (!registerPassword) {
      setError("Ο κωδικός πρόσβασης είναι υποχρεωτικός");
      setIsSubmitting(false);
      return;
    }

    if (registerPassword.length < 6) {
      setError("Ο κωδικός πρόσβασης πρέπει να έχει τουλάχιστον 6 χαρακτήρες");
      setIsSubmitting(false);
      return;
    }

    if (registerPassword !== passwordConfirmation) {
      setError("Οι κωδικοί πρόσβασης δεν ταιριάζουν");
      setIsSubmitting(false);
      return;
    }
    // ---------------------------

    try {
      const result = await register(
        firstName,
        lastName,
        registerEmail,
        registerPassword,
        passwordConfirmation,
        telephone
      );
      console.log("🔍 Registration result:", result);
      if (result.success) {
        // Show OTP modal instead of closing
        console.log("✅ Registration successful, showing OTP modal");
        setShowOTPModal(true);
        setError("");
      } else {
        console.log("❌ Registration failed:", result.error);
        setError(result.error || "Η εγγραφή απέτυχε");
      }
    } catch (error) {
      console.error("❌ Registration error:", error);
      setError("Παρουσιάστηκε απροσδόκητο σφάλμα");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");

    if (otp.length !== 6) {
      setOtpError("Παρακαλώ εισάγετε τον 6ψήφιο κωδικό");
      return;
    }

    setIsVerifyingOTP(true);

    try {
      const response = await fetch("/api/auth/customer/verify-activation", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: registerEmail, otp }),
      });

      const data = await response.json();

      if (data.success) {
        // Sign the user in after successful verification
        toast.success("Η επιβεβαίωση ολοκληρώθηκε επιτυχώς!");
        
        // Fetch user data and set it in auth context
        const userResponse = await fetch("/api/auth/user", {
          method: "GET",
          credentials: "include",
        });

        const userData = await userResponse.json();
        if (userData.success && userData.data?.user) {
          const verifiedUser = userData.data.user;
          
          // Store user data in sessionStorage so auth context picks it up
          const userToStore = {
            email: verifiedUser.email,
            name: verifiedUser.name,
            first_name: verifiedUser.first_name,
            last_name: verifiedUser.last_name,
            phone: verifiedUser.phone || verifiedUser.telephone,
            telephone: verifiedUser.telephone,
            date_of_birth: verifiedUser.date_of_birth,
            address: verifiedUser.address,
            city: verifiedUser.city,
            postcode: verifiedUser.postcode,
            created_at: verifiedUser.created_at,
            updated_at: verifiedUser.updated_at,
          };
          
          sessionStorage.setItem("user", JSON.stringify(userToStore));
          
          // Close modal and reset
          onClose();
          resetForm();
          setShowOTPModal(false);
          setOtp("");
          
          // Trigger a small delay then reload to ensure auth context picks up the user
          setTimeout(() => {
            window.location.reload();
          }, 100);
        } else {
          // Still close modal even if user fetch fails
          onClose();
          resetForm();
          setShowOTPModal(false);
          setOtp("");
        }
      } else {
        setOtpError(
          data.error || "Μη έγκυρος κωδικός. Παρακαλώ δοκιμάστε ξανά."
        );
      }
    } catch (error) {
      setOtpError("Παρουσιάστηκε σφάλμα. Παρακαλώ δοκιμάστε ξανά.");
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setRemember(false);
    setFirstName("");
    setLastName("");
    setRegisterEmail("");
    setRegisterPassword("");
    setPasswordConfirmation("");
    setTelephone("");
    setError("");
    setShowOTPModal(false);
    setOtp("");
    setOtpError("");
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-6 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white hover:bg-zinc-800 p-1.5 rounded-lg transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
            {showOTPModal && currentMode === "register"
              ? "Επιβεβαίωση Email"
              : currentMode === "login"
              ? "Σύνδεση"
              : "Δημιουργία λογαριασμού"}
          </h2>
        </div>

        {currentMode === "login" && !showOTPModal ? (
          <>
            <div className="space-y-3 mb-6">
              <form onSubmit={handleLoginSubmit} noValidate>
                <div className="mb-6">
                  <div className="space-y-4">
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-black border-zinc-800 text-white placeholder:text-zinc-600 h-12 focus-visible:ring-[var(--brand-border)] focus-visible:border-[var(--brand-border)]"
                    />
                    <Input
                      type="password"
                      placeholder="Κωδικός πρόσβασης"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-black border-zinc-800 text-white placeholder:text-zinc-600 h-12 focus-visible:ring-[var(--brand-border)] focus-visible:border-[var(--brand-border)]"
                    />
                  </div>
                  <div className="mt-2">
                    <Link href="/forgot-password">
                      <Button
                        type="button"
                        variant="link"
                        className="text-sm text-zinc-400 hover:text-[var(--brand-border)] transition-colors p-0 h-auto font-normal"
                      >
                        Ξεχάσετε τον κωδικό πρόσβασης;
                      </Button>
                    </Link>
                  </div>

                  {/* Remember Me Checkbox */}
                  <div className="flex items-center space-x-2 mt-4">
                    <Checkbox
                      id="remember"
                      checked={remember}
                      onCheckedChange={(checked) =>
                        setRemember(checked === true)
                      }
                      className="data-[state=checked]:bg-[var(--brand-border)] data-[state=checked]:border-[var(--brand-border)] border-zinc-600 bg-zinc-900"
                    />
                    <label
                      htmlFor="remember"
                      className="text-sm text-zinc-300 cursor-pointer select-none"
                    >
                      Θυμήσου με
                    </label>
                  </div>

                  {error && (
                    <p className="text-red-400 text-sm mt-3 bg-red-900/10 p-2 rounded border border-red-900/20 animate-in fade-in slide-in-from-top-1">
                        {error}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="w-full bg-[var(--brand-border)] hover:bg-[var(--brand-hover)] text-white h-12 mb-4 disabled:opacity-50 font-bold shadow-lg shadow-red-900/10 transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? "Συνδέομαι..." : "Είσοδος"}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-800"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-zinc-900 text-zinc-500">ή</span>
                </div>
              </div>

              {/* Google Sign-In Button */}
              <Button
                type="button"
                onClick={() => {
                  window.location.href = "/api/auth/google";
                }}
                className="w-full bg-white hover:bg-gray-100 text-gray-900 h-12 mb-4 font-medium border border-gray-300 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Σύνδεση με Google
              </Button>
              
              {/* Switch to Register Button */}
              <div className="pt-2 border-t border-zinc-800">
                <p className="text-center text-zinc-500 text-sm mb-3">Δεν έχετε λογαριασμό;</p>
                <Button
                  type="button"
                  onClick={() => {
                    setError("");
                    setCurrentMode("register");
                  }}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white h-12 font-bold border border-zinc-700 hover:border-zinc-600 transition-all"
                >
                  Εγγραφή
                </Button>
              </div>
            </div>
          </>
        ) : showOTPModal && currentMode === "register" ? (
          <div>
            <div className="mb-6">
              <p className="text-zinc-400 text-sm">
                Παρακαλώ ελέγξτε το mail σας για τον 6ψήφιο κωδικό επιβεβαίωσης
              </p>
            </div>

            <form onSubmit={handleOTPSubmit} noValidate>
              <div className="mb-6">
                <div className="flex justify-center mb-4">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(value) => {
                      setOtp(value);
                      setOtpError("");
                    }}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="bg-black border-zinc-800 text-white" />
                      <InputOTPSlot index={1} className="bg-black border-zinc-800 text-white" />
                      <InputOTPSlot index={2} className="bg-black border-zinc-800 text-white" />
                      <InputOTPSlot index={3} className="bg-black border-zinc-800 text-white" />
                      <InputOTPSlot index={4} className="bg-black border-zinc-800 text-white" />
                      <InputOTPSlot index={5} className="bg-black border-zinc-800 text-white" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {otpError && (
                  <p className="text-red-400 text-sm mt-3 bg-red-900/10 p-2 rounded border border-red-900/20 animate-in fade-in slide-in-from-top-1">
                    {otpError}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isVerifyingOTP || otp.length !== 6}
                className="w-full bg-[var(--brand-border)] hover:bg-[var(--brand-hover)] text-white h-12 mb-2 disabled:opacity-50 font-bold shadow-lg shadow-red-900/10 transition-all active:scale-[0.98]"
              >
                {isVerifyingOTP ? "Επαληθεύεται..." : "Επιβεβαίωση"}
              </Button>
            </form>
          </div>
        ) : (
          <form onSubmit={handleRegisterSubmit} noValidate>
            <div className="text-left mb-6">
              <Button
                type="button"
                onClick={() => {
                    setError("");
                    setCurrentMode("login");
                }}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white h-12 font-bold border border-zinc-700 hover:border-zinc-600 transition-all"
              >
                Έχετε ήδη λογαριασμό; Σύνδεση
              </Button>
            </div>
            <div className="mb-6">
              <div className="space-y-4">
                {/* First Name and Last Name side by side */}
                <div className="flex gap-4">
                  <Input
                    type="text"
                    placeholder="Όνομα"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="bg-black border-zinc-800 text-white placeholder:text-zinc-600 h-12 flex-1 focus-visible:ring-[var(--brand-border)] focus-visible:border-[var(--brand-border)]"
                  />
                  <Input
                    type="text"
                    placeholder="Επώνυμο"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="bg-black border-zinc-800 text-white placeholder:text-zinc-600 h-12 flex-1 focus-visible:ring-[var(--brand-border)] focus-visible:border-[var(--brand-border)]"
                  />
                </div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  className="bg-black border-zinc-800 text-white placeholder:text-zinc-600 h-12 focus-visible:ring-[var(--brand-border)] focus-visible:border-[var(--brand-border)]"
                />
                <Input
                  type="tel"
                  placeholder="Τηλέφωνο (10 ψηφία)"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className="bg-black border-zinc-800 text-white placeholder:text-zinc-600 h-12 focus-visible:ring-[var(--brand-border)] focus-visible:border-[var(--brand-border)]"
                />
                <Input
                  type="password"
                  placeholder="Κωδικός πρόσβασης"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className="bg-black border-zinc-800 text-white placeholder:text-zinc-600 h-12 focus-visible:ring-[var(--brand-border)] focus-visible:border-[var(--brand-border)]"
                />
                <Input
                  type="password"
                  placeholder="Επιβεβαίωση κωδικού"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  className="bg-black border-zinc-800 text-white placeholder:text-zinc-600 h-12 focus-visible:ring-[var(--brand-border)] focus-visible:border-[var(--brand-border)]"
                />
              </div>

              {error && <p className="text-red-400 text-sm mt-3 bg-red-900/10 p-2 rounded border border-red-900/20 animate-in fade-in slide-in-from-top-1">{error}</p>}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full bg-[var(--brand-border)] hover:bg-[var(--brand-hover)] text-white h-12 mb-2 disabled:opacity-50 font-bold shadow-lg shadow-red-900/10 transition-all active:scale-[0.98]"
            >
              {isSubmitting ? "Εγγραφή..." : "Εγγραφή"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}