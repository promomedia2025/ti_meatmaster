"use client";

import { useSearchParams, usePathname } from "next/navigation";
import { XCircle, AlertCircle, RefreshCw, Home, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PaymentFailedPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const orderId = searchParams.get("orderId");
  const reason = searchParams.get("reason");
  
  // Extract language from pathname
  const lang = pathname.split("/")[1] || "el";

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-sans selection:bg-[#7C2429]/40">
      <div className="max-w-md w-full">
        {/* Main Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 text-center shadow-2xl">
          
          {/* Header Section */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
              Η πληρωμή απέτυχε
            </h1>
            <p className="text-zinc-400 text-sm leading-relaxed px-4 text-balance">
              Δυστυχώς, η συναλλαγή σας δεν μπόρεσε να ολοκληρωθεί από τη <span className="text-white font-semibold">Viva.com</span>.
            </p>
          </div>

          {/* Action List / Instructions Box */}
          <div className="bg-[#ff9328]/5 border border-[#ff9328]/20 rounded-2xl p-6 mb-8 text-left">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#ff9328] mt-0.5 shrink-0" />
              <div>
                <p className="text-base text-[#ff9328] font-bold mb-3">
                  Τι μπορείτε να κάνετε:
                </p>
                <ul className="text-[13px] text-zinc-300 space-y-2.5">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#ff9328] rounded-full shrink-0" />
                    Ελέγξτε αν το υπόλοιπο επαρκεί (Primary account).
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#ff9328] rounded-full shrink-0" />
                    Εγκρίνετε τη συναλλαγή μέσω του Viva app.
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#ff9328] rounded-full shrink-0" />
                    Βεβαιωθείτε ότι η κάρτα είναι ξεκλείδωτη.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Buttons Stack */}
          <div className="space-y-4">
            <Link href={`/${lang}/checkout`} className="block">
              <Button className="w-full bg-[#ff9328] hover:bg-[#915316] text-white py-7 rounded-2xl transition-all shadow-lg shadow-[#7C2429]/20 flex items-center justify-center gap-2 text-lg font-bold">
                <RefreshCw className="w-5 h-5" />
                Δοκιμή Ξανά
              </Button>
            </Link>

            <div className="flex justify-center">
              <Link href={`/${lang}`}>
                <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-800/40 px-8 py-6 rounded-xl flex items-center gap-2 transition-colors text-base">
                  <Home className="w-5 h-5" />
                  Αρχική
                </Button>
              </Link>
            </div>
            
            {orderId && (
              <Link href={`/${lang}/order/${orderId}`} className="block">
                <Button variant="outline" className="w-full border-zinc-800 bg-transparent text-zinc-500 hover:text-white hover:border-zinc-700 py-6 rounded-xl flex gap-2 text-xs uppercase tracking-widest font-bold transition-all">
                  <CreditCard className="w-4 h-4" />
                  Προβολή Παραγγελίας
                </Button>
              </Link>
            )}
          </div>

          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t border-zinc-800/60">
            <p className="text-[12px] text-zinc-500 leading-relaxed px-2">
              Χρειάζεστε βοήθεια; Επικοινωνήστε μαζί μας στο <span className="text-zinc-300 underline underline-offset-4 decoration-zinc-600 hover:text-[#7C2429] transition-colors cursor-pointer font-medium">κατάστημα</span> αναφέροντας το ID της παραγγελίας σας.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}