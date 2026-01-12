import { NextRequest, NextResponse } from "next/server";
import { verifyPiraeusPaymentCallback } from "@/lib/piraeus-payment";

export const dynamic = "force-dynamic";

/**
 * API Route: Piraeus Bank Payment Callback
 * 
 * This endpoint handles the callback from Piraeus Bank after payment processing.
 * It verifies the payment result and redirects the user to the appropriate page.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get("orderId");
    const cancelled = searchParams.get("cancelled") === "true";
    const lang = searchParams.get("lang") || "el"; // Default to Greek

    console.log("💳 [PAYMENT CALLBACK] Received callback:", {
      orderId,
      cancelled,
      lang,
      allParams: Object.fromEntries(searchParams.entries()),
    });

    // If payment was cancelled by user
    if (cancelled) {
      console.log("❌ [PAYMENT CALLBACK] Payment was cancelled by user");
      const failureUrl = process.env.PIRAEUS_FAILURE_URL || 
        `${request.nextUrl.origin}/${lang}/payment/failed?orderId=${encodeURIComponent(orderId || "")}&reason=${encodeURIComponent("Payment cancelled by user")}`;
      return NextResponse.redirect(failureUrl);
    }

    // Extract all callback parameters from Piraeus Bank
    const callbackData: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      callbackData[key] = value;
    });

    console.log("💳 [PAYMENT CALLBACK] Extracted callback data:", callbackData);

    // Verify payment callback
    const paymentResult = verifyPiraeusPaymentCallback(callbackData);
    
    console.log("💳 [PAYMENT CALLBACK] Verification result:", paymentResult);

    if (!paymentResult) {
      console.error("Invalid payment callback data:", callbackData);
      console.error("Callback search params:", Object.fromEntries(searchParams.entries()));
      const failureUrl = process.env.PIRAEUS_FAILURE_URL || 
        `${request.nextUrl.origin}/${lang}/payment/failed?orderId=${encodeURIComponent(orderId || "")}&reason=${encodeURIComponent("Invalid payment response")}`;
      return NextResponse.redirect(failureUrl);
    }

    // Update order payment status in your system
    // This should be done via your backend API
    try {
      const updateResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId || paymentResult.orderId}/payment-status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transactionId: paymentResult.transactionId,
            status: paymentResult.status,
            amount: paymentResult.amount,
            currency: paymentResult.currency,
            message: paymentResult.message,
          }),
        }
      );

      if (!updateResponse.ok) {
        console.error("Failed to update order payment status");
      }
    } catch (updateError) {
      console.error("Error updating order payment status:", updateError);
      // Continue with redirect even if update fails
    }

    // Redirect based on payment status
    if (paymentResult.status === "success") {
      console.log("✅ [PAYMENT CALLBACK] Payment successful, redirecting to success page");
      const successUrl = process.env.PIRAEUS_SUCCESS_URL || 
        `${request.nextUrl.origin}/${lang}/payment/success?orderId=${encodeURIComponent(paymentResult.orderId)}&transactionId=${encodeURIComponent(paymentResult.transactionId)}`;
      return NextResponse.redirect(successUrl);
    } else {
      console.log("❌ [PAYMENT CALLBACK] Payment failed, redirecting to failure page:", {
        status: paymentResult.status,
        message: paymentResult.message,
      });
      const failureUrl = process.env.PIRAEUS_FAILURE_URL || 
        `${request.nextUrl.origin}/${lang}/payment/failed?orderId=${encodeURIComponent(paymentResult.orderId)}&reason=${encodeURIComponent(paymentResult.message || paymentResult.status)}`;
      return NextResponse.redirect(failureUrl);
    }
  } catch (error) {
    console.error("❌ [PAYMENT CALLBACK] Error processing callback:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    const lang = request.nextUrl.searchParams.get("lang") || "el";
    const orderId = request.nextUrl.searchParams.get("orderId");
    const failureUrl = process.env.PIRAEUS_FAILURE_URL || 
      `${request.nextUrl.origin}/${lang}/payment/failed${orderId ? `?orderId=${encodeURIComponent(orderId)}&reason=${encodeURIComponent("An error occurred processing your payment")}` : "?reason=" + encodeURIComponent("An error occurred processing your payment")}`;
    return NextResponse.redirect(failureUrl);
  }
}

