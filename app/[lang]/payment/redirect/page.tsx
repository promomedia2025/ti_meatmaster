"use client";

import { useEffect, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PaymentRedirectContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get the form HTML from URL parameters or sessionStorage
    const formHtml = searchParams.get("form");
    const storageKey = searchParams.get("key");
    
    let decodedFormHtml: string | null = null;
    
    if (storageKey) {
      // Retrieve from sessionStorage
      decodedFormHtml = sessionStorage.getItem(storageKey);
      if (decodedFormHtml) {
        // Clean up sessionStorage after retrieving
        sessionStorage.removeItem(storageKey);
      }
    } else if (formHtml) {
      // Decode from URL parameter
      decodedFormHtml = decodeURIComponent(formHtml);
    }
    
    if (!decodedFormHtml) {
      document.body.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: Arial, sans-serif;">
          <div style="text-align: center;">
            <p style="color: #333; font-size: 18px;">Σφάλμα: Δεν βρέθηκε φόρμα πληρωμής</p>
          </div>
        </div>
      `;
      return;
    }
    
    // Create a temporary container to parse the form
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = decodedFormHtml;
    const form = tempDiv.querySelector('form');
    
    if (!form) {
      document.body.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: Arial, sans-serif;">
          <div style="text-align: center;">
            <p style="color: #333; font-size: 18px;">Σφάλμα: Δεν βρέθηκε φόρμα πληρωμής</p>
          </div>
        </div>
      `;
      return;
    }

    // Extract form action and method
    const formAction = form.getAttribute('action') || '';
    const formMethod = form.getAttribute('method') || 'POST';
    
    // Create and populate the form
    const paymentForm = document.createElement('form');
    paymentForm.method = formMethod;
    paymentForm.action = formAction;
    paymentForm.style.display = 'none';
    
    // Copy all input fields
    form.querySelectorAll('input').forEach((input) => {
      const htmlInput = input as HTMLInputElement;
      const newInput = document.createElement('input');
      newInput.type = htmlInput.type || 'hidden';
      newInput.name = htmlInput.name;
      newInput.value = htmlInput.value;
      paymentForm.appendChild(newInput);
    });
    
    // Add form to body and submit
    document.body.appendChild(paymentForm);
    
    // Small delay to ensure form is ready, then submit
    setTimeout(() => {
      paymentForm.submit();
    }, 100);
  }, [searchParams]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '18px', color: '#333', marginBottom: '10px' }}>
          Παρακαλώ περιμένετε...
        </p>
        <p style={{ fontSize: '14px', color: '#666' }}>
          Ανακατεύθυνση στην πύλη πληρωμής...
        </p>
      </div>
    </div>
  );
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
