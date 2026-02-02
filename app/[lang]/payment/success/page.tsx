"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle, Home, ClipboardList, Receipt, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter(); // Για το αυτόματο redirect
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState(5); // Αντίστροφη μέτρηση

  const orderId = searchParams.get("orderId");
  const transactionId = searchParams.get("transactionId");
  const lang = pathname.split("/")[1] || "el";

  // 1. Αρχικό Loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // 2. Αυτόματο Redirect Mechanism
  useEffect(() => {
    if (!isLoading && orderId) {
      // Timer για την αντίστροφη μέτρηση στην οθόνη
      const interval = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      // Timer για την πραγματική μεταφορά
      const redirectTimer = setTimeout(() => {
        router.push(`/${lang}/order/${orderId}`);
      }, 5000);

      return () => {
        clearInterval(interval);
        clearTimeout(redirectTimer);
      };
    }
  }, [isLoading, orderId, lang, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 text-center">
          <Skeleton className="h-20 w-20 mx-auto mb-6 rounded-full bg-zinc-800" />
          <Skeleton className="h-8 w-3/4 mx-auto mb-4 bg-zinc-800" />
          <Skeleton className="h-4 w-full mb-8 bg-zinc-800" />
          <div className="space-y-4">
            <Skeleton className="h-16 w-full rounded-2xl bg-zinc-800" />
            <Skeleton className="h-12 w-full rounded-2xl bg-zinc-800" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-sans selection:bg-[#7C2429]/40">
      <div className="max-w-md w-full">
        <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 text-center shadow-2xl relative overflow-hidden">

          {/* Success Icon & Header */}
          <div className="relative mb-6 inline-block">
            <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
            <CheckCircle className="w-20 h-20 text-green-500 relative z-10" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
            Επιτυχής Πληρωμή!
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed px-4 text-balance">
            Η παραγγελία σας ολοκληρώθηκε. Θα μεταφερθείτε αυτόματα σε <span className="text-white font-bold">{countdown}s</span>.
          </p>

          {/* Info Cards */}
          <div className="mt-8 space-y-3">
            {orderId && (
              <div className="bg-black/40 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ClipboardList className="w-5 h-5 text-[#E54B53]" />
                  <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Παραγγελία</span>
                </div>
                <span className="text-lg font-bold text-white">#{orderId}</span>
              </div>
            )}

            {transactionId && (
              <div className="bg-black/40 border border-zinc-800 rounded-2xl p-4 flex flex-col items-start gap-1 text-left">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-zinc-500" />
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Transaction ID</span>
                </div>
                <span className="text-[11px] text-zinc-300 font-mono break-all">{transactionId}</span>
              </div>
            )}
          </div>

          {/* Buttons Stack */}
          <div className="mt-8 space-y-4">
            {orderId && (
              <Link href={`/${lang}/order/${orderId}`} className="block">
                <Button className="w-full bg-[#7C2429] hover:bg-[#601D21] text-white py-7 rounded-2xl transition-all shadow-lg shadow-[#7C2429]/20 flex items-center justify-center gap-2 text-lg font-bold">
                  Προβολή Παραγγελίας
                </Button>
              </Link>
            )}

            <div className="flex justify-center">
              <Link href={`/${lang}`}>
                <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-800/40 px-8 py-6 rounded-xl flex items-center gap-2 transition-colors text-base">
                  <Home className="w-5 h-5" />
                  Αρχική
                </Button>
              </Link>
            </div>
          </div>

          {/* Auto-redirect indicator */}
          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-zinc-500 tracking-tighter">
            <Loader2 className="w-3 h-3 animate-spin" />
            Ανακατεύθυνση στην παραγγελία...
          </div>
        </div>
      </div>
    </div>
  );
}