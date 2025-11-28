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
      </div>
    </div>
  );
}
