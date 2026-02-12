"use client";

import { useSearchParams, usePathname } from "next/navigation";
import { CheckCircle, XCircle, Loader2, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function PiraeusBankAuthorizePage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFailure, setIsFailure] = useState(false);
  
  // Extract language from pathname
  const lang = pathname.split("/")[1] || "el";

  useEffect(() => {
    const callAuthorizeAPI = async () => {
      try {
        // Collect all query parameters
        const params: Record<string, string> = {};
        searchParams.forEach((value, key) => {
          params[key] = value;
        });

        
        // Store params for later use (for redirect)
        const locationId = params.locationId || params.orderId || "";

        // Call the authorize API endpoint
        const response = await fetch("/api/piraeusbank/authorize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(params),
        });

        const result = await response.json();

        // Extract payment_verified from response structure
        // Response structure: { success: boolean, data: { payment_verified: boolean, ... } }
        const paymentVerified = result?.data?.payment_verified;
        

        // Check payment_verified from response
        if (paymentVerified === true) {
          setIsSuccess(true);
          
          // Notify parent window (checkout page) about successful payment
          if (window.opener) {
            window.opener.postMessage({
              type: "PAYMENT_STATUS",
              paymentVerified: true,
            }, window.location.origin);
          }
          
          // Close window after a short delay
          setTimeout(() => {
            window.close();
          }, 2000);
        } else {
          setIsFailure(true);
          
          // Notify parent window (checkout page) about failed payment
          if (window.opener) {
            window.opener.postMessage({
              type: "PAYMENT_STATUS",
              paymentVerified: false,
            }, window.location.origin);
          }
          
          // Close window and redirect parent (checkout page) back to checkout after a delay
          setTimeout(() => {
            // Redirect parent window (checkout page) back to checkout
            if (window.opener) {
              if (locationId) {
                window.opener.location.href = `/${lang}/checkout?locationId=${locationId}`;
              } else {
                window.opener.location.href = `/${lang}/checkout`;
              }
            }
            // Close this window
            window.close();
          }, 3000);
        }
      } catch (error) {
        setIsFailure(true);
      } finally {
        setIsLoading(false);
      }
    };

    callAuthorizeAPI();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-sans selection:bg-[var(--brand-border)]/40">
      <div className="max-w-md w-full">
        {/* Main Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 text-center shadow-2xl relative overflow-hidden">

          {isLoading && (
            <div className="animate-in fade-in duration-500">
              <div className="relative mb-6 inline-block">
                <div className="absolute inset-0 bg-[var(--brand-border)]/20 blur-xl rounded-full animate-pulse" />
                <Loader2 className="w-20 h-20 text-[#E54B53] relative z-10 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">
                Επεξεργασία πληρωμής...
              </h1>
              <p className="text-zinc-400 text-sm leading-relaxed px-4 mb-8">
                Παρακαλώ περιμένετε ενώ επιβεβαιώνουμε τη συναλλαγή σας με τη <span className="text-white font-medium">Viva.com</span>.
              </p>
            </div>
          )}

          {isSuccess && (
            <div className="animate-in zoom-in-95 duration-500">
              <div className="relative mb-6 inline-block">
                <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
                <CheckCircle className="w-20 h-20 text-green-500 relative z-10" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">
                Η πληρωμή ολοκληρώθηκε!
              </h1>
              <p className="text-zinc-400 text-sm leading-relaxed px-4 mb-8">
                Η πληρωμή σας επιβεβαιώθηκε με επιτυχία. Η παραγγελία σας ετοιμάζεται!
              </p>
            </div>
          )}

          {isFailure && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <div className="relative mb-6 inline-block">
                <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
                <XCircle className="w-20 h-20 text-red-500 relative z-10" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">
                Η πληρωμή απέτυχε
              </h1>
              <p className="text-zinc-400 text-sm leading-relaxed px-4 mb-8">
                Δυστυχώς, η πληρωμή δεν μπόρεσε να ολοκληρωθεί. Παρακαλώ δοκιμάστε ξανά.
              </p>
            </div>
          )}

          {/* Dynamic Buttons Stack */}
          <div className="space-y-4">
            {isFailure ? (
              <Link href={`/${lang}/checkout${searchParams.get("locationId") ? `?locationId=${searchParams.get("locationId")}` : ""}`} className="block">
                <Button className="w-full bg-[var(--brand-border)] hover:bg-[var(--brand-hover)] text-white py-7 rounded-2xl transition-all shadow-lg shadow-[var(--brand-border)]/20 flex items-center justify-center gap-2 text-lg font-bold">
                  <ArrowLeft className="w-5 h-5" />
                  Επιστροφή στο Checkout
                </Button>
              </Link>
            ) : (
              <Link href={`/${lang}`} className="block">
                <Button className="w-full bg-[var(--brand-border)] hover:bg-[var(--brand-hover)] text-white py-7 rounded-2xl transition-all shadow-lg shadow-[var(--brand-border)]/20 flex items-center justify-center gap-2 text-lg font-bold">
                  {isSuccess ? "Συνέχεια στην Αρχική" : "Επιστροφή στην Αρχική"}
                </Button>
              </Link>
            )}

            {!isLoading && (
              <div className="flex justify-center">
                <Link href={`/${lang}`}>
                  <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-800/40 px-8 py-6 rounded-xl flex items-center gap-2 transition-colors text-base">
                    <Home className="w-5 h-5" />
                    Αρχική
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Footer Info */}
          {!isLoading && (
            <div className="mt-8 pt-6 border-t border-zinc-800/60 text-[11px] text-zinc-500 italic">
              cocofino.gr • Ασφαλείς Πληρωμές μέσω ePay
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
