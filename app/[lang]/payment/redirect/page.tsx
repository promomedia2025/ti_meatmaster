"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PaymentRedirect } from "@/components/PaymentRedirect";

function PaymentRedirectContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const lang = searchParams.get("lang") || "el";

  // TODO: Replace these with your actual payment gateway credentials
  const paymentFormData = {
    AcquirerId: process.env.NEXT_PUBLIC_ACQUIRER_ID || ""  , // Replace with actual value
    MerchantId: process.env.NEXT_PUBLIC_MERCHANT_ID || "", // Replace with actual value
    PosId: process.env.NEXT_PUBLIC_POS_ID || "", // Replace with actual value
    User: process.env.NEXT_PUBLIC_USER || "", // Replace with actual value
    LanguageCode: lang === "en" ? "en-US" : "el-GR",
    MerchantReference: orderId || "",
    ParamBackLink: typeof window !== 'undefined' 
      ? `${window.location.origin}/${lang}/payment/callback?orderId=${orderId}`
      : `/${lang}/payment/callback?orderId=${orderId}`,
  };

  if (!orderId) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#333', fontSize: '18px' }}>
            Σφάλμα: Δεν βρέθηκε αναγνωριστικό παραγγελίας
          </p>
        </div>
      </div>
    );
  }

  return <PaymentRedirect formData={paymentFormData} />;
}

export default function PaymentRedirectPage() {
  return (
    <Suspense
      fallback={
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          fontFamily: 'Arial, sans-serif'
        }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#333', fontSize: '18px' }}>Φόρτωση...</p>
          </div>
        </div>
      }
    >
      <PaymentRedirectContent />
    </Suspense>
  );
}
