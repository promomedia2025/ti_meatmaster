"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

type ServerUser = {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  telephone?: string;
  phone?: string;
  name?: string;
};

const DISMISS_KEY = "phone_required_modal_dismissed_v1";

function isValidPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10;
}

export function PhoneRequiredModal() {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [serverUser, setServerUser] = useState<ServerUser | null>(null);
  const [phoneValue, setPhoneValue] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const hasTelephone = useMemo(() => {
    const v = user?.telephone || user?.phone || "";
    return !!v?.trim();
  }, [user?.telephone, user?.phone]);

  // Decide when to show: authenticated + missing telephone + not dismissed
  useEffect(() => {
    if (!isAuthenticated) {
      setIsOpen(false);
      setServerUser(null);
      setPhoneValue("");
      setError("");
      return;
    }

    if (hasTelephone) {
      setIsOpen(false);
      setServerUser(null);
      setPhoneValue("");
      setError("");
      return;
    }

    if (typeof window !== "undefined") {
      const dismissed = sessionStorage.getItem(DISMISS_KEY);
      if (dismissed === "1") {
        return;
      }
    }

    setIsOpen(true);
  }, [isAuthenticated, hasTelephone]);

  // When opened, fetch the full user from backend (id + names are required for PUT)
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/auth/user", {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok || !data?.success || !data?.data?.user) {
          throw new Error(data?.error || "Failed to load user");
        }
        if (cancelled) return;
        setServerUser(data.data.user as ServerUser);
      } catch (e: any) {
        if (cancelled) return;
        setError(
          "Δεν μπορέσαμε να φορτώσουμε τα στοιχεία σας. Παρακαλώ δοκιμάστε ξανά.",
        );
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSkip = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(DISMISS_KEY, "1");
    }
    setIsOpen(false);
    setServerUser(null);
    setPhoneValue("");
    setError("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmed = phoneValue.trim();
    if (!trimmed) {
      setError("Το τηλέφωνο είναι υποχρεωτικό");
      return;
    }
    if (!isValidPhone(trimmed)) {
      setError("Παρακαλώ εισάγετε έγκυρο αριθμό τηλεφώνου (10 ψηφία)");
      return;
    }
    if (!serverUser?.id || !serverUser?.email) {
      setError("Δεν ήταν δυνατή η ενημέρωση. Παρακαλώ δοκιμάστε ξανά.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/auth/user", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: serverUser.id,
          first_name: serverUser.first_name || "",
          last_name: serverUser.last_name || "",
          email: serverUser.email,
          telephone: trimmed,
          skip_email_verification: true,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || data?.message || "Update failed");
      }

      await refreshUser({ telephone: trimmed, phone: trimmed });
      toast.success("Το τηλέφωνό σας ενημερώθηκε με επιτυχία.");

      if (typeof window !== "undefined") {
        sessionStorage.removeItem(DISMISS_KEY);
      }

      setIsOpen(false);
      setServerUser(null);
      setPhoneValue("");
      setError("");
    } catch (e: any) {
      setError(
        e?.message ||
          "Παρουσιάστηκε σφάλμα κατά την ενημέρωση. Παρακαλώ δοκιμάστε ξανά.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[120] p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-6 relative shadow-2xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
            Προσθέστε το τηλέφωνό σας
          </h2>
          <p className="text-sm text-zinc-400">
            Χρειαζόμαστε έναν έγκυρο αριθμό τηλεφώνου για ενημερώσεις και
            επικοινωνία σχετικά με τις παραγγελίες σας.
          </p>
        </div>

        <form onSubmit={handleSave} noValidate>
          <div className="space-y-4">
            <Input
              type="tel"
              placeholder="Τηλέφωνο (10 ψηφία)"
              value={phoneValue}
              onChange={(e) => setPhoneValue(e.target.value)}
              className="bg-black border-zinc-800 text-white placeholder:text-zinc-600 h-12 focus-visible:ring-[var(--brand-border)] focus-visible:border-[var(--brand-border)]"
              autoFocus
            />

            {error && (
              <p className="text-red-400 text-sm bg-red-900/10 p-2 rounded border border-red-900/20 animate-in fade-in slide-in-from-top-1">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isSaving}
              className="w-full bg-[var(--brand-border)] hover:bg-[var(--brand-hover)] text-white h-12 disabled:opacity-50 font-bold shadow-lg shadow-red-900/10 transition-all active:scale-[0.98]"
            >
              {isSaving ? "Αποθήκευση..." : "Αποθήκευση"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
