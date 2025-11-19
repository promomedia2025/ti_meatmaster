"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect } from "react";
import React from "react";
import Link from "next/link";

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
  const [remember, setRemember] = useState(false);

  // Registration fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [telephone, setTelephone] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update current mode when prop changes
  React.useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = await login(email, password, remember);
      if (result.success) {
        onClose();
        resetForm();
      } else {
        setError(result.error || "Login failed");
      }
    } catch (error) {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    // Client-side validation
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

    if (!telephone.trim()) {
      setError("Το τηλέφωνο είναι υποχρεωτικό");
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

    try {
      const result = await register(
        firstName,
        lastName,
        registerEmail,
        registerPassword,
        passwordConfirmation,
        telephone
      );
      if (result.success) {
        onClose();
        resetForm();
      } else {
        setError(result.error || "Η εγγραφή απέτυχε");
      }
    } catch (error) {
      setError("Παρουσιάστηκε απροσδόκητο σφάλμα");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    // Reset login fields
    setEmail("");
    setPassword("");
    setRemember(false);

    // Reset registration fields
    setFirstName("");
    setLastName("");
    setRegisterEmail("");
    setRegisterPassword("");
    setPasswordConfirmation("");
    setTelephone("");

    setError("");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-[#1a1a1a] rounded-lg w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            {currentMode === "login" ? "Σύνδεση" : "Δημιούργησε λογαριασμό"}
          </h2>
        </div>

        {currentMode === "login" ? (
          <>
            <div className="space-y-3 mb-6">
              <div className="text-left">
                <button
                  type="button"
                  onClick={() => setCurrentMode("register")}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Δεν έχετε λογαριασμό? Εγγραφή
                </button>
              </div>
              <form onSubmit={handleLoginSubmit}>
                <div className="mb-4">
                  <div className="space-y-3">
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-[#2a2a2a] border-gray-600 text-white placeholder:text-gray-500 h-12"
                    />
                    <Input
                      type="password"
                      placeholder="Κωδικός πρόσβασης"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-[#2a2a2a] border-gray-600 text-white placeholder:text-gray-500 h-12"
                    />
                  </div>
                  <div>
                    <Link href="/forgot-password">
                      <Button
                        type="button"
                        variant="link"
                        className="text-sm text-gray-400 hover:text-white transition-colors p-2 text-left"
                      >
                        Ξεχάσετε τον κωδικό πρόσβασης;
                      </Button>
                    </Link>
                  </div>

                  {/* Remember Me Checkbox */}
                  <div className="flex items-center space-x-2 mt-3">
                    <Checkbox
                      id="remember"
                      checked={remember}
                      onCheckedChange={(checked) =>
                        setRemember(checked === true)
                      }
                    />
                    <label
                      htmlFor="remember"
                      className="text-sm text-gray-300 cursor-pointer"
                    >
                      Θυμήσου με
                    </label>
                  </div>

                  {error && (
                    <p className="text-red-400 text-sm mt-2">{error}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="w-full bg-[#009DE0] hover:bg-[#0088CC] text-white h-12 mb-4 disabled:opacity-50"
                >
                  {isSubmitting ? "Συνδέομαι..." : "Επόμενο"}
                </Button>
              </form>
              {/* Google Sign In */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 !bg-white border-gray-300 text-black hover:!bg-gray-100 flex items-center justify-center h-12 p-2"
                >
                  <svg className="w-8 h-8 !w-7 !h-7" viewBox="0 0 24 24">
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
                </Button>

                {/* Apple Sign In */}
                <Button
                  variant="outline"
                  className="flex-1 !bg-white border-gray-300 text-black hover:!bg-gray-100 hover:!text-black flex items-center justify-center h-12 p-2"
                >
                  <svg
                    className="w-8 h-8 !w-7 !h-7"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                </Button>

                {/* Facebook Sign In */}
                <Button className="flex-1 bg-[#1877F2] hover:bg-[#166FE5] text-white flex items-center justify-center h-12 p-2">
                  <svg
                    className="w-8 h-8 !w-7 !h-7"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </Button>
              </div>
            </div>
          </>
        ) : (
          <form onSubmit={handleRegisterSubmit}>
            <div className="text-left">
              <button
                type="button"
                onClick={() => setCurrentMode("login")}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Έχετε ήδη λογαριασμό? Σύνδεση
              </button>
            </div>
            <div className="mb-4">
              <div className="space-y-3">
                {/* First Name and Last Name side by side */}
                <div className="flex gap-3">
                  <Input
                    type="text"
                    placeholder="Όνομα"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="bg-[#2a2a2a] border-gray-600 text-white placeholder:text-gray-500 h-12 flex-1"
                  />
                  <Input
                    type="text"
                    placeholder="Επώνυμο"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="bg-[#2a2a2a] border-gray-600 text-white placeholder:text-gray-500 h-12 flex-1"
                  />
                </div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                  className="bg-[#2a2a2a] border-gray-600 text-white placeholder:text-gray-500 h-12"
                />
                <Input
                  type="tel"
                  placeholder="Τηλέφωνο"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  required
                  className="bg-[#2a2a2a] border-gray-600 text-white placeholder:text-gray-500 h-12"
                />
                <Input
                  type="password"
                  placeholder="Κωδικός πρόσβασης"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                  className="bg-[#2a2a2a] border-gray-600 text-white placeholder:text-gray-500 h-12"
                />
                <Input
                  type="password"
                  placeholder="Επιβεβαίωση κωδικού"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  required
                  className="bg-[#2a2a2a] border-gray-600 text-white placeholder:text-gray-500 h-12"
                />
              </div>

              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full bg-[#009DE0] hover:bg-[#0088CC] text-white h-12 mb-4 disabled:opacity-50"
            >
              {isSubmitting ? "Εγγραφή..." : "Εγγραφή"}
            </Button>
          </form>
        )}

        <div className="text-xs text-gray-500 leading-relaxed">
          Δες τη{" "}
          <a href="#" className="text-[#009DE0] hover:underline">
            Δήλωση Προστασίας Προσωπικών Δεδομένων Wolt
          </a>{" "}
          στα Αγγλικά, ώστε να μάθεις σχετικά με την επεξεργασία προσωπικών
          δεδομένων στη Wolt. Μπορείς να δεις επίσης στην ενότητα Ιδιωτικότητα.
          Ισχύει η{" "}
          <a href="#" className="text-[#009DE0] hover:underline">
            Πολιτική Απορρήτου
          </a>{" "}
          που σχετίζεται με τον λογαριασμό σου στη Wolt στην επόμενη φάση της
          εγγραφής σου, όταν θα λάβεις δηλώσεις δικαιωμάτων. Ισχύουν οι
          προϋποθέσεις χώρας και γλώσσας που ισχύουν σε εσένα. Η ιστοσελίδα
          προστατεύεται από το reCaptcha. Ισχύει η{" "}
          <a href="#" className="text-[#009DE0] hover:underline">
            Πολιτική Απορρήτου
          </a>{" "}
          και οι{" "}
          <a href="#" className="text-[#009DE0] hover:underline">
            Όροι χρήσης
          </a>{" "}
          του reCaptcha.
        </div>
      </div>
    </div>
  );
}
