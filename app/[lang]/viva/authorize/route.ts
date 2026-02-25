import { NextRequest, NextResponse } from "next/server";
import { getVivaTransaction, verifyVivaPaymentCallback } from "@/lib/viva-payment";

export const dynamic = "force-dynamic";

/**
 * Route: Viva Payments Authorize Callback
 * 
 * This route handles the callback from Viva Payments after payment processing.
 * Configured in Viva Payments bank settings as: /{lang}/viva/authorize
 * 
 * Viva sends parameters:
 * - t: Transaction ID
 * - s: Session ID
 * - lang: Language (e.g., el-GR)
 * - eventId: 0 = success, 1 = pending, 2 = failed
 * - eci: ECI value
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { lang: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Extract Viva callback parameters
    const transactionId = searchParams.get("t") || searchParams.get("s") || "";
    const eventId = searchParams.get("eventId");
    const langParam = searchParams.get("lang") || params.lang || "el";
    // Extract language code (el-GR -> el)
    const lang = langParam.split("-")[0] || "el";

    // Extract all callback data
    const callbackData: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      callbackData[key] = value;
    });

    // Fetch transaction details from Viva Payments Transaction API
    // GET request to: https://api.vivapayments.com/checkout/v2/transactions/{transactionId}
    // This will give us the orderId (in merchantTrns field)
    let paymentResult = null;
    
    if (transactionId) {
      paymentResult = await getVivaTransaction(transactionId);
    }

    // Fallback to parsing callback data if API call fails or no transaction ID
    if (!paymentResult) {
      
      // If we have eventId, use it to determine status
      if (eventId !== undefined && eventId !== null) {
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
          orderId: "", // Will be extracted from transaction API if available
          status: status,
          amount: 0, // Will be fetched from API if transactionId is available
          currency: "EUR",
          message: eventIdNum === 0 ? "Payment successful" : eventIdNum === 2 ? "Payment failed" : "Payment pending",
        };
      } else {
        paymentResult = verifyVivaPaymentCallback(callbackData);
      }
    }

    if (!paymentResult) {
      // Redirect back to checkout on invalid response
      const checkoutUrl = process.env.VIVA_FAILURE_URL || 
        `${request.nextUrl.origin}/${lang}/checkout`;
      return NextResponse.redirect(checkoutUrl);
    }

    // Extract orderId from paymentResult (extracted from merchantTrns via API)
    // Order status is updated via webhook, so no need to make API call here
    const orderId = paymentResult.orderId;

    // Redirect to payment confirmation page with payment result details
    // Use merchantTrns (orderId) from the transaction API response
    const confirmationParams = new URLSearchParams({
      status: paymentResult.status,
      amount: paymentResult.amount.toString(),
      currency: paymentResult.currency,
    });

    // orderId comes from merchantTrns field in the API response
    if (orderId) {
      confirmationParams.set("orderId", orderId);
    }

    if (paymentResult.message) {
      confirmationParams.set("message", paymentResult.message);
    }

    const confirmationUrl = `${request.nextUrl.origin}/${lang}/viva/confirmation?${confirmationParams.toString()}`;

    return NextResponse.redirect(confirmationUrl);
  } catch (error) {
    console.error("❌ [VIVA AUTHORIZE] Error processing callback:", error);
    const lang = request.nextUrl.searchParams.get("lang")?.split("-")[0] || "el";
    // Redirect back to checkout on error
    const checkoutUrl = process.env.VIVA_FAILURE_URL || 
      `${request.nextUrl.origin}/${lang}/checkout`;
    return NextResponse.redirect(checkoutUrl);
  }
}
