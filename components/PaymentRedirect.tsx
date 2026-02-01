'use client';

import { useEffect, useRef } from 'react';

interface PaymentFormData {
  AcquirerId: string;
  MerchantId: string;
  PosId: string;
  User: string;
  LanguageCode: string;
  MerchantReference: string;
  ParamBackLink?: string;
}

export function PaymentRedirect({ formData }: { formData: PaymentFormData }) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // Submit immediately on mount
    if (formRef.current) {
      formRef.current.submit();
    }
  }, []);

  return (
    <form
      ref={formRef}
      action="https://paycenter.piraeusbank.gr/redirection/pay.aspx"
      method="POST"
      // No target="_blank" - form submits in current window (already in a new tab from checkout)
    >
      <input type="hidden" name="AcquirerId" value={formData.AcquirerId} />
      <input type="hidden" name="MerchantId" value={formData.MerchantId} />
      <input type="hidden" name="PosId" value={formData.PosId} />
      <input type="hidden" name="User" value={formData.User} />
      <input type="hidden" name="LanguageCode" value={formData.LanguageCode} />
      <input type="hidden" name="MerchantReference" value={formData.MerchantReference} />
      {formData.ParamBackLink && (
        <input type="hidden" name="ParamBackLink" value={formData.ParamBackLink} />
      )}
      
      {/* Fallback button in case auto-submit fails */}
      <noscript>
        <button type="submit">Συνέχεια στην πληρωμή</button>
      </noscript>
    </form>
  );
}
