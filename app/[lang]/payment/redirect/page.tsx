"use client";

import { useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function PaymentRedirectContent() {
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const hasSubmitted = useRef(false);

  useEffect(() => {
    // Get the form HTML from URL params (base64 encoded)
    const formHtml = searchParams.get("form");
    
    if (!formHtml || hasSubmitted.current) {
      return;
    }

    try {
      // Decode the form HTML
      const decodedFormHtml = decodeURIComponent(atob(formHtml));
      
      // Parse the form
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = decodedFormHtml;
      const originalForm = tempDiv.querySelector("form");

      if (!originalForm || !formRef.current) {
        console.error("Could not find payment form");
        return;
      }

      // Extract form attributes
      const formAction = originalForm.getAttribute("action") || "";
      const formMethod = originalForm.getAttribute("method") || "POST";

      // Set form attributes
      formRef.current.method = formMethod;
      formRef.current.action = formAction;

      // Copy all input fields
      originalForm.querySelectorAll("input").forEach((input) => {
        const htmlInput = input as HTMLInputElement;
        const newInput = document.createElement("input");
        newInput.type = htmlInput.type || "hidden";
        newInput.name = htmlInput.name;
        newInput.value = htmlInput.value;
        formRef.current?.appendChild(newInput);
      });

      // Mark as submitted to prevent double submission
      hasSubmitted.current = true;

      // Auto-submit after a short delay to ensure form is ready
      setTimeout(() => {
        if (formRef.current) {
          formRef.current.submit();
        }
      }, 100);
    } catch (error) {
      console.error("Error processing payment form:", error);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="text-white text-lg mb-4">Ανακατεύθυνση στην πύλη πληρωμής...</div>
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <form ref={formRef} style={{ display: "none" }}></form>
      </div>
    </div>
  );
}

export default function PaymentRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="text-center">
            <div className="text-white text-lg mb-4">Φόρτωση...</div>
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      }
    >
      <PaymentRedirectContent />
    </Suspense>
  );
}
