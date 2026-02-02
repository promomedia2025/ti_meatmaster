import { NextRequest, NextResponse } from "next/server";
import { verifyPiraeusPaymentCallback } from "@/lib/piraeus-payment";

export const dynamic = "force-dynamic";

/**
 * API Route: Piraeus Bank Payment Webhook
 * 
 * This endpoint handles server-to-server notifications from Piraeus Bank
 * about payment status changes. This is more reliable than callback redirects.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify webhook signature/authentication
    // TODO: Implement webhook signature verification based on Piraeus Bank's documentation
    const webhookSecret = process.env.PIRAEUS_WEBHOOK_SECRET;
    if (webhookSecret) {
      // Verify webhook authenticity
      // const isValid = verifyWebhookSignature(request, webhookSecret);
      // if (!isValid) {
      //   return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401 });
      // }
    }

    // Verify payment callback data
    const paymentResult = verifyPiraeusPaymentCallback(body);

    if (!paymentResult) {
      return NextResponse.json(
        { success: false, error: "Invalid payment data" },
        { status: 400 }
      );
    }

    // Update order payment status in your system
    try {
      const updateResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/orders/${paymentResult.orderId}/payment-status`,
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
        return NextResponse.json(
          { success: false, error: "Failed to update order status" },
          { status: 500 }
        );
      }
    } catch (updateError) {
      return NextResponse.json(
        { success: false, error: "Error updating order status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment status updated successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}


