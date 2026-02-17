import { NextRequest, NextResponse } from "next/server";
import { getVivaTransaction, verifyVivaPaymentCallback } from "@/lib/viva-payment";

export const dynamic = "force-dynamic";

/**
 * API Route: Viva Payments Payment Callback
 * 
 * This endpoint handles the callback from Viva Payments after payment processing.
 * It verifies the payment result and redirects the user to the appropriate page.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get("orderId");
    const cancelled = searchParams.get("cancelled") === "true";
    const lang = searchParams.get("lang") || "el";

    console.log("💳 [VIVA CALLBACK] Received callback:", {
      orderId,
      cancelled,
      lang,
      allParams: Object.fromEntries(searchParams.entries()),
    });

    // If payment was cancelled by user
    if (cancelled) {
      console.log("❌ [VIVA CALLBACK] Payment was cancelled by user");
      const failureUrl = process.env.VIVA_FAILURE_URL || 
        `${request.nextUrl.origin}/${lang}/payment/failed?orderId=${encodeURIComponent(orderId || "")}&reason=${encodeURIComponent("Payment cancelled by user")}`;
      return NextResponse.redirect(failureUrl);
    }

    // Extract transaction ID from callback parameters
    // Viva Payments may send transaction ID in various formats
    const callbackData: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      callbackData[key] = value;
    });

    console.log("💳 [VIVA CALLBACK] Extracted callback data:", callbackData);

    // Extract transaction ID from callback parameters
    // Viva Payments Smart Checkout may send 's' as session/transaction ID
    const transactionId =
      callbackData.TransactionId ||
      callbackData.transactionId ||
      callbackData.t ||
      callbackData.OrderCode ||
      callbackData.orderCode ||
      callbackData.s || // Smart Checkout session ID
      "";

    // Check eventId if present (Smart Checkout format)
    // eventId: 0 = success, 1 = pending, 2 = failed
    const eventId = callbackData.eventId || callbackData.EventId;
    
    // Fetch transaction details from Viva Payments Transaction API
    let paymentResult = null;
    
    if (transactionId) {
      console.log("💳 [VIVA CALLBACK] Fetching transaction from API:", transactionId);
      paymentResult = await getVivaTransaction(transactionId);
    }

    // Fallback to parsing callback data if API call fails or no transaction ID
    if (!paymentResult) {
      console.log("💳 [VIVA CALLBACK] Falling back to callback data parsing");
      
      // If we have eventId, use it to determine status
      if (eventId !== undefined) {
        const eventIdNum = parseInt(eventId.toString());
        let status: "success" | "failed" | "pending" | "cancelled" = "pending";
        
        if (eventIdNum === 0) {
          status = "success";
        } else if (eventIdNum === 2) {
          status = "failed";
        } else if (eventIdNum === 1) {
          status = "pending";
        }
        
        // Create a payment result from callback data
        paymentResult = {
          transactionId: transactionId || callbackData.s || "",
          orderId: orderId || "",
          status: status,
          amount: 0, // Will be fetched from API if transactionId is available
          currency: "EUR",
          message: eventIdNum === 0 ? "Payment successful" : eventIdNum === 2 ? "Payment failed" : "Payment pending",
        };
      } else {
        paymentResult = verifyVivaPaymentCallback(callbackData);
      }
    }
    
    console.log("💳 [VIVA CALLBACK] Verification result:", paymentResult);

    if (!paymentResult) {
      console.error("Invalid payment callback data:", callbackData);
      const failureUrl = process.env.VIVA_FAILURE_URL || 
        `${request.nextUrl.origin}/${lang}/payment/failed?orderId=${encodeURIComponent(orderId || "")}&reason=${encodeURIComponent("Invalid payment response")}`;
      return NextResponse.redirect(failureUrl);
    }

    // Update order payment status in your system
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
      console.log("✅ [VIVA CALLBACK] Payment successful, redirecting to success page");
      const successUrl = process.env.VIVA_SUCCESS_URL || 
        `${request.nextUrl.origin}/${lang}/payment/success?orderId=${encodeURIComponent(paymentResult.orderId)}&transactionId=${encodeURIComponent(paymentResult.transactionId)}`;
      return NextResponse.redirect(successUrl);
    } else {
      console.log("❌ [VIVA CALLBACK] Payment failed, redirecting to failure page:", {
        status: paymentResult.status,
        message: paymentResult.message,
      });
      const failureUrl = process.env.VIVA_FAILURE_URL || 
        `${request.nextUrl.origin}/${lang}/payment/failed?orderId=${encodeURIComponent(paymentResult.orderId)}&reason=${encodeURIComponent(paymentResult.message || paymentResult.status)}`;
      return NextResponse.redirect(failureUrl);
    }
  } catch (error) {
    console.error("❌ [VIVA CALLBACK] Error processing callback:", error);
    const lang = request.nextUrl.searchParams.get("lang") || "el";
    const orderId = request.nextUrl.searchParams.get("orderId");
    const failureUrl = process.env.VIVA_FAILURE_URL || 
      `${request.nextUrl.origin}/${lang}/payment/failed${orderId ? `?orderId=${encodeURIComponent(orderId)}&reason=${encodeURIComponent("An error occurred processing your payment")}` : "?reason=" + encodeURIComponent("An error occurred processing your payment")}`;
    return NextResponse.redirect(failureUrl);
  }
}
