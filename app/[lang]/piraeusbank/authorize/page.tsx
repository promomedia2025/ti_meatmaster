"use client";

import { useSearchParams, usePathname } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
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

        console.log("💳 [AUTHORIZE PAGE] Calling authorize API with params:", params);
        
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
        console.log("💳 [AUTHORIZE PAGE] Authorize API response:", result);

        // Extract payment_verified from nested response structure
        // Response structure: { data: { data: { payment_verified: boolean } } }
        const paymentVerified = result?.data?.data?.payment_verified;
        
        console.log("💳 [AUTHORIZE PAGE] Payment verified:", paymentVerified);

        // Check payment_verified from response
        if (paymentVerified === true) {
          setIsSuccess(true);
          
          // Notify parent window (checkout page) about successful payment
          if (window.opener) {
            window.opener.postMessage({
              type: "PAYMENT_STATUS",
              paymentVerified: true,
            }, window.location.origin);
            console.log("💳 [AUTHORIZE PAGE] Sent success message to parent window");
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
            console.log("💳 [AUTHORIZE PAGE] Sent failure message to parent window");
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
        console.error("💳 [AUTHORIZE PAGE] Error calling authorize API:", error);
        setIsFailure(true);
      } finally {
        setIsLoading(false);
      }
    };

    callAuthorizeAPI();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-lg p-8 text-center">
        {isLoading ? (
          <>
            <Loader2 className="w-20 h-20 text-blue-500 mx-auto mb-6 animate-spin" />
            <h1 className="text-2xl font-bold text-white mb-4">
              Επεξεργασία πληρωμής...
            </h1>
            <p className="text-gray-400 mb-6">
              Παρακαλώ περιμένετε ενώ επεξεργαζόμαστε την πληρωμή σας.
            </p>
          </>
        ) : isSuccess ? (
          <>
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-white mb-4">
              Η πληρωμή ολοκληρώθηκε επιτυχώς!
            </h1>
            <p className="text-gray-400 mb-6">
              Η πληρωμή σας έχει επιβεβαιωθεί με επιτυχία.
            </p>
          </>
        ) : isFailure ? (
          <>
            <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-white mb-4">
              Η πληρωμή απέτυχε
            </h1>
            <p className="text-gray-400 mb-6">
              Δυστυχώς, η πληρωμή δεν μπόρεσε να ολοκληρωθεί.
            </p>
          </>
        ) : null}

        <div className="space-y-3">
          {isSuccess ? (
            <Link href={`/${lang}`}>
              <Button className="w-full bg-primary hover:bg-primary/90">
                Επιστροφή στην Αρχική
              </Button>
            </Link>
          ) : isFailure ? (
            <Link href={`/${lang}/checkout${searchParams.get("locationId") ? `?locationId=${searchParams.get("locationId")}` : ""}`}>
              <Button className="w-full bg-primary hover:bg-primary/90">
                Επιστροφή στο Checkout
              </Button>
            </Link>
          ) : (
            <Link href={`/${lang}`}>
              <Button className="w-full bg-primary hover:bg-primary/90">
                Επιστροφή στην Αρχική
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
