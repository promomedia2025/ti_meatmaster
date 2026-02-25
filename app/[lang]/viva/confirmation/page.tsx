"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PaymentConfirmationPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  const orderId = searchParams.get("orderId");
  const status = searchParams.get("status"); // "success" | "failed" | "pending"
  const amount = searchParams.get("amount");
  const currency = searchParams.get("currency") || "EUR";
  const message = searchParams.get("message");
  const lang = pathname.split("/")[1] || "el";

  const isSuccess = status === "success";
  const isFailed = status === "failed";
  const isPending = status === "pending";

  // Auto-redirect to order page after countdown
  useEffect(() => {
    if (isSuccess && orderId) {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isSuccess, orderId]);

  // Handle redirect when countdown reaches 0
  useEffect(() => {
    if (isSuccess && orderId && countdown === 0) {
      router.push(`/${lang}/order/${orderId}`);
    }
  }, [isSuccess, orderId, countdown, lang, router]);

  const formatAmount = (amount: string | null) => {
    if (!amount) return "—";
    const numAmount = parseFloat(amount);
    // Use euro symbol (€) instead of "EUR"
    return `${numAmount.toFixed(2)} €`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-sans selection:bg-[#7C2429]/40">
      <div className="max-w-md w-full">
        <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 text-center shadow-2xl relative overflow-hidden">
          {/* Status Icon & Header */}
          <div className="relative mb-6 inline-block">
            {isSuccess && (
              <>
                <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
                <CheckCircle className="w-20 h-20 text-green-500 relative z-10" />
              </>
            )}
            {isFailed && (
              <>
                <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
                <XCircle className="w-20 h-20 text-red-500 relative z-10" />
              </>
            )}
            {isPending && (
              <>
                <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full" />
                <Loader2 className="w-20 h-20 text-yellow-500 relative z-10 animate-spin" />
              </>
            )}
          </div>

          <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
            {isSuccess && "Επιτυχής Πληρωμή!"}
            {isFailed && "Αποτυχία Πληρωμής"}
            {isPending && "Πληρωμή σε Εξέλιξη"}
          </h1>

          {message && (
            <p className="text-zinc-400 text-sm leading-relaxed px-4 text-balance mb-4">
              {message}
            </p>
          )}

          {isSuccess && orderId && (
            <p className="text-zinc-400 text-sm leading-relaxed px-4 text-balance mb-4">
              Η παραγγελία σας ολοκληρώθηκε. Θα μεταφερθείτε αυτόματα σε{" "}
              <span className="text-white font-bold">{countdown}s</span>.
            </p>
          )}

          {/* Payment Details */}
          <div className="mt-8 space-y-3">
            {orderId && (
              <div className="bg-black/40 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
                <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                  Παραγγελία
                </span>
                <span className="text-lg font-bold text-white">#{orderId}</span>
              </div>
            )}

            {amount && (
              <div className="bg-black/40 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
                <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                  Ποσό
                </span>
                <span className="text-lg font-bold text-white">
                  {formatAmount(amount)}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 space-y-4">
            {isSuccess && orderId && (
              <Link href={`/${lang}/order/${orderId}`} className="block">
                <Button className="w-full bg-[#7C2429] hover:bg-[#601D21] text-white py-7 rounded-2xl transition-all shadow-lg shadow-[#7C2429]/20 flex items-center justify-center gap-2 text-lg font-bold">
                  Προβολή Παραγγελίας
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            )}

            {isFailed && (
              <Link href={`/${lang}/checkout`} className="block">
                <Button className="w-full bg-[#7C2429] hover:bg-[#601D21] text-white py-7 rounded-2xl transition-all shadow-lg shadow-[#7C2429]/20 flex items-center justify-center gap-2 text-lg font-bold">
                  Επιστροφή στο Checkout
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            )}

            {isPending && (
              <div className="text-zinc-400 text-sm">
                Παρακαλώ περιμένετε ενώ επεξεργαζόμαστε την πληρωμή σας...
              </div>
            )}
          </div>

          {/* Auto-redirect indicator */}
          {isSuccess && orderId && (
            <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-zinc-500 tracking-tighter">
              <Loader2 className="w-3 h-3 animate-spin" />
              Ανακατεύθυνση στην παραγγελία...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
