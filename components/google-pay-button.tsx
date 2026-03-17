"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";

declare global {
  interface Window {
    google?: any;
  }
}

interface GooglePayButtonProps {
  amount: number; // in EUR, full order amount including tip
  disabled?: boolean;
}

/**
 * Google Pay button for Viva Wallet (Native Google Pay API)
 *
 * NOTE:
 * - This is the frontend button + Google Pay client initialization.
 * - It does NOT yet complete the payment with Viva – the payment token is logged
 *   and should be sent to a backend endpoint that calls Viva's Native Google Pay API.
 *
 * Required env vars (to be configured):
 * - NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID
 * - NEXT_PUBLIC_VIVA_GOOGLE_PAY_GATEWAY_MERCHANT_ID  (your Viva merchant / gateway id)
 */
export function GooglePayButton({ amount, disabled }: GooglePayButtonProps) {
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const paymentsClientRef = useRef<any | null>(null);

  const environment =
    process.env.NEXT_PUBLIC_GOOGLE_PAY_ENV === "PRODUCTION"
      ? "PRODUCTION"
      : "TEST";

  const googlePayMerchantId =
    process.env.NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID || "";

  // For Viva Wallet, the gateway merchant ID is typically the same as VIVA_MERCHANT_ID
  // You can find it in your Viva Wallet merchant dashboard under Settings > Integrations > Google Pay
  const vivaGatewayMerchantId =
    process.env.NEXT_PUBLIC_VIVA_GOOGLE_PAY_GATEWAY_MERCHANT_ID ||
    process.env.NEXT_PUBLIC_VIVA_MERCHANT_ID ||
    "";

  // Load Google Pay script
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.google?.payments?.api) {
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://pay.google.com/gp/p/js/pay.js"]'
    );
    if (existingScript) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://pay.google.com/gp/p/js/pay.js";
    script.async = true;
    script.onload = () => {
      // Script loaded – we'll initialize the client in a separate effect
    };
    script.onerror = () => {
      console.error("Failed to load Google Pay script");
      toast.error("Αποτυχία φόρτωσης του Google Pay");
    };
    document.head.appendChild(script);
  }, []);

  // Initialize PaymentsClient once google API is available
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.google?.payments?.api) return;
    if (paymentsClientRef.current) return;

    try {
      const client = new window.google.payments.api.PaymentsClient({
        environment,
      });
      paymentsClientRef.current = client;

      const allowedPaymentMethods = [getBaseCardPaymentMethod(vivaGatewayMerchantId)];

      const isReadyToPayRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods,
      };

      client
        .isReadyToPay(isReadyToPayRequest)
        .then((response: any) => {
          if (response.result) {
            setIsReady(true);
          } else {
            console.warn("Google Pay is not available on this device");
          }
        })
        .catch((err: any) => {
          console.error("Error checking Google Pay availability:", err);
        });
    } catch (error) {
      console.error("Error initializing Google Pay client:", error);
    }
  }, [environment, vivaGatewayMerchantId]);

  const createPaymentDataRequest = useCallback(() => {
    const totalAmount = amount.toFixed(2);

    return {
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [getBaseCardPaymentMethod(vivaGatewayMerchantId)],
      transactionInfo: {
        totalPriceStatus: "FINAL",
        totalPrice: totalAmount,
        currencyCode: "EUR",
        countryCode: "GR",
      },
      merchantInfo: {
        merchantName: "Perfetta", // Display name
        ...(googlePayMerchantId && { merchantId: googlePayMerchantId }),
      },
    };
  }, [amount, googlePayMerchantId, vivaGatewayMerchantId]);

  const handleClick = async () => {
    if (!paymentsClientRef.current) {
      toast.error("Το Google Pay δεν είναι έτοιμο ακόμη");
      return;
    }
    if (!vivaGatewayMerchantId) {
      toast.error(
        "Το Google Pay δεν έχει ρυθμιστεί σωστά (λείπει το Viva gateway merchant id)"
      );
      return;
    }

    setIsProcessing(true);
    try {
      const paymentDataRequest = createPaymentDataRequest();
      console.log("🔵 Google Pay Request:", {
        environment,
        vivaGatewayMerchantId,
        googlePayMerchantId: googlePayMerchantId || "Not set",
        amount,
        paymentDataRequest,
      });

      const paymentData =
        await paymentsClientRef.current.loadPaymentData(paymentDataRequest);

      // Extract token and send to backend (to be implemented)
      const token =
        paymentData?.paymentMethodData?.tokenizationData?.token || null;

      console.log("✅ Google Pay paymentData:", paymentData);
      console.log("✅ Google Pay token:", token);

      toast.success(
        "Λήφθηκε token από το Google Pay. Η ολοκλήρωση της πληρωμής με Viva πρέπει να υλοποιηθεί στο backend."
      );

      // TODO: Send token to backend endpoint that calls Viva Native Google Pay API
      // await fetch("/api/viva/googlepay", { method: "POST", body: JSON.stringify({ token, amount }) })
    } catch (err: any) {
      console.error("❌ Google Pay error details:", {
        error: err,
        statusCode: err?.statusCode,
        statusMessage: err?.statusMessage,
        message: err?.message,
        environment,
        vivaGatewayMerchantId,
        googlePayMerchantId: googlePayMerchantId || "Not set",
      });

      if (err?.statusCode === "CANCELED") {
        console.log("Google Pay payment cancelled by user");
        // Don't show error toast for user cancellation
      } else if (err?.statusCode === "DEVELOPER_ERROR" || err?.statusCode?.includes("OR_BIBED")) {
        // Configuration error
        toast.error(
          "Σφάλμα ρυθμίσεων Google Pay. Ελέγξτε ότι το Merchant ID είναι σωστά ρυθμισμένο.",
          {
            description: `Error: ${err?.statusCode || err?.statusMessage || "Unknown"}. Επικοινωνήστε με τον διαχειριστή.`,
          }
        );
      } else {
        toast.error("Σφάλμα κατά την πληρωμή με Google Pay", {
          description: err?.statusMessage || err?.message || "Άγνωστο σφάλμα",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const isButtonDisabled =
    disabled || !isReady || isProcessing || amount <= 0 || !vivaGatewayMerchantId;

  // Debug logging
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log("🔵 Google Pay Button State:", {
        isReady,
        isProcessing,
        amount,
        vivaGatewayMerchantId: vivaGatewayMerchantId ? "✅ Set" : "❌ Missing",
        disabled,
        isButtonDisabled,
      });
    }
  }, [isReady, isProcessing, amount, vivaGatewayMerchantId, disabled, isButtonDisabled]);

  // Show a message if merchant ID is missing (configuration issue)
  if (!vivaGatewayMerchantId) {
    console.warn("⚠️ Google Pay: Viva gateway merchant ID is missing. Set NEXT_PUBLIC_VIVA_MERCHANT_ID or NEXT_PUBLIC_VIVA_GOOGLE_PAY_GATEWAY_MERCHANT_ID");
    return (
      <div className="w-full mt-3 p-3 rounded-md bg-yellow-900/20 border border-yellow-800 text-yellow-400 text-xs">
        ⚠️ Google Pay δεν είναι διαθέσιμο: λείπει το Viva Merchant ID. Ελέγξτε τις ρυθμίσεις.
      </div>
    );
  }

  return (
    <div className="w-full mt-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={isButtonDisabled}
        className="w-full h-12 min-h-[48px] mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-white border border-zinc-200 text-zinc-800 font-medium text-sm hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        aria-label={isReady ? "Πληρωμή με Google Pay" : "Φόρτωση Google Pay"}
      >
        {isProcessing ? (
          <span className="animate-pulse">Επεξεργασία...</span>
        ) : !isReady ? (
          <span className="animate-pulse">Φόρτωση Google Pay...</span>
        ) : (
          <>
            <img
              src="https://www.gstatic.com/instantbuy/svg/dark_gpay.svg"
              alt=""
              width={80}
              height={32}
              className="h-8 w-auto object-contain"
            />
            <span className="sr-only sm:not-sr-only sm:inline">Πληρωμή με Google Pay</span>
          </>
        )}
      </button>
    </div>
  );
}

function getBaseCardPaymentMethod(vivaGatewayMerchantId: string) {
  return {
    type: "CARD",
    parameters: {
      allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
      allowedCardNetworks: ["AMEX", "JCB", "MASTERCARD", "VISA"],
      billingAddressRequired: false,
    },
    tokenizationSpecification: {
      type: "PAYMENT_GATEWAY",
      parameters: {
        // According to Viva Native Google Pay docs, the gateway must be 'vivawallet'
        gateway: "vivawallet",
        gatewayMerchantId: vivaGatewayMerchantId,
      },
    },
  };
}

