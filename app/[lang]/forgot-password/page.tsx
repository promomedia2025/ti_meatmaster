"use client";

import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  // Email form state
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Reset password form state (when code is present)
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(
          data.error || "Παρουσιάστηκε σφάλμα. Παρακαλώ δοκιμάστε ξανά."
        );
      }
    } catch (error) {
      setError("Παρουσιάστηκε σφάλμα. Παρακαλώ δοκιμάστε ξανά.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess(false);

    // Validation
    if (password.length < 8) {
      setResetError("Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες");
      return;
    }

    if (password !== confirmPassword) {
      setResetError("Οι κωδικοί δεν ταιριάζουν");
      return;
    }

    setIsResetting(true);

    try {
      const response = await fetch("/api/auth/password-reset/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          password,
          password_confirmation: confirmPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResetSuccess(true);
      } else {
        setResetError(
          data.error || "Παρουσιάστηκε σφάλμα. Παρακαλώ δοκιμάστε ξανά."
        );
      }
    } catch (error) {
      setResetError("Παρουσιάστηκε σφάλμα. Παρακαλώ δοκιμάστε ξανά.");
    } finally {
      setIsResetting(false);
    }
  };

  // Show reset password form if code is present
  if (code) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Back button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Επιστροφή</span>
          </Link>

          {/* Reset Password Form Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-xl">
            <h1 className="text-2xl font-bold text-white mb-2">
              Ορίστε Νέο Κωδικό
            </h1>
            <p className="text-zinc-400 text-sm mb-6">
              Εισάγετε τον νέο σας κωδικό πρόσβασης.
            </p>

            {resetSuccess ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
                <p className="text-green-400 text-sm">
                  Ο κωδικός σας ενημερώθηκε επιτυχώς. Μπορείτε να συνδεθείτε
                  τώρα.
                </p>
                <div className="mt-4">
                  <Link href="/">
                    <Button className="w-full h-12 bg-[var(--brand-border)] hover:bg-[var(--brand-hover)] text-white font-bold transition-all shadow-lg active:scale-[0.98]">
                      Σύνδεση
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div>
                  <Input
                    type="password"
                    placeholder="Νέος Κωδικός"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-black border-zinc-800 text-white placeholder:text-zinc-600 h-12 focus-visible:ring-[var(--brand-border)] focus-visible:border-[var(--brand-border)]"
                    disabled={isResetting}
                    minLength={8}
                  />
                </div>

                <div>
                  <Input
                    type="password"
                    placeholder="Επιβεβαίωση Κωδικού"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="bg-black border-zinc-800 text-white placeholder:text-zinc-600 h-12 focus-visible:ring-[var(--brand-border)] focus-visible:border-[var(--brand-border)]"
                    disabled={isResetting}
                    minLength={8}
                  />
                </div>

                {resetError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-400 text-sm">{resetError}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isResetting}
                  className="w-full h-12 bg-[var(--brand-border)] hover:bg-[var(--brand-hover)] text-white font-bold transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
                >
                  {isResetting ? "Ενημέρωση..." : "Ενημέρωση Κωδικού"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show email form if no code is present
  return (
    <div className="h-[70vh] bg-black flex top-[200px] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Επιστροφή</span>
        </Link>

        {/* Email Form Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-white mb-2">
            Επαναφορά Κωδικού
          </h1>
          <p className="text-zinc-400 text-sm mb-6">
            Εισάγετε το email σας και θα σας στείλουμε οδηγίες για την επαναφορά
            του κωδικού πρόσβασης.
          </p>

          {success ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
              <p className="text-green-400 text-sm">
                Έχουμε στείλει οδηγίες επαναφοράς κωδικού στο email σας.
              </p>
            </div>
          ) : (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-black border-zinc-800 text-white placeholder:text-zinc-600 h-12 focus-visible:ring-[var(--brand-border)] focus-visible:border-[var(--brand-border)]"
                  disabled={isSubmitting}
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-[var(--brand-border)] hover:bg-[var(--brand-hover)] text-white font-bold transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? "Αποστολή..." : "Αποστολή"}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-zinc-400 hover:text-white transition-colors hover:underline"
            >
              Θυμάστε τον κωδικό σας; Σύνδεση
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
              <div className="text-center text-zinc-400 animate-pulse">Φόρτωση...</div>
            </div>
          </div>
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}