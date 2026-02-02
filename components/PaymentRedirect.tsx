'use client';

import { useEffect, useRef } from 'react';

interface PaymentFormData {
  [key: string]: string | undefined;
}

export function PaymentRedirect({ formData }: { formData: PaymentFormData }) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // Submit immediately on mount
    if (formRef.current) {
      formRef.current.submit();
    }
  }, []);

  // Get form action from formData or use default
  const formAction = formData.action || "https://paycenter.piraeusbank.gr/redirection/pay.aspx";

  return (
    <form
      ref={formRef}
      action={formAction}
      method="POST"
      // No target="_blank" - form submits in current window (already in a new tab from checkout)
    >
      {Object.entries(formData).map(([name, value]) => {
        // Skip 'action' as it's not a form field
        if (name === 'action' || value === undefined || value === null) {
          return null;
        }
        return (
          <input key={name} type="hidden" name={name} value={value} />
        );
      })}
      
      {/* Fallback button in case auto-submit fails */}
      <noscript>
        <button type="submit">Συνέχεια στην πληρωμή</button>
      </noscript>
    </form>
  );
}
