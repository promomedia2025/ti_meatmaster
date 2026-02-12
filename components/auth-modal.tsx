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

  // Validation Helpers
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPhone = (phone: string) => {
    // Check if it has at least 10 digits (handling +30 or spaces)
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 10;
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
      setError("Παρακαλώ εισάγετε έγκυρο αριθμό τηλεφώνου (τουλάχιστον 10 ψηφία)");
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
            {currentMode === "login" ? "Σύνδεση" : "Δημιουργία λογαριασμού"}
          </h2>
        </div>

        {currentMode === "login" ? (
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
                  placeholder="Τηλέφωνο"
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