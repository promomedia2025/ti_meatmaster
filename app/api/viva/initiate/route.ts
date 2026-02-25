import { NextRequest, NextResponse } from "next/server";
import { createVivaPaymentSession } from "@/lib/viva-payment";

export const dynamic = "force-dynamic";

/**
 * API Route: Initiate Viva Payments Session
 * 
 * This endpoint creates a payment session with Viva Payments and returns
 * a payment URL for redirection.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log("💳 [VIVA INITIATE] Incoming request body:", JSON.stringify(body, null, 2));
    
    const {
      orderId,
      amount,
      currency = "EUR",
      description,
      customerEmail,
      customerName,
      customerPhone,
      customerAddress,
      customerCity,
      customerZipCode,
      customerCountryCode = "GR",
      lang,
    } = body;

    // Validate required fields
    if (!orderId || !amount || !description) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: orderId, amount, and description are required",
        },
        { status: 400 }
      );
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid amount. Amount must be a positive number",
        },
        { status: 400 }
      );
    }

    // Get base URL for callback URLs (use request origin for dynamic URL)
    const baseUrl = request.nextUrl.origin;
    const language = lang || "el";
    // Point to authorize route (configured in Viva Payments bank settings)
    // Viva will redirect to this route after payment processing
    const successUrl = `${baseUrl}/${language}/viva/authorize`;
    const failureUrl = `${baseUrl}/${language}/viva/authorize`;

    // Create payment session
    const paymentSession = await createVivaPaymentSession({
      orderId: orderId.toString(),
      amount: amountNum,
      currency,
      description,
      customerEmail,
      customerName,
      customerPhone,
      customerAddress,
      customerCity,
      customerZipCode,
      customerCountryCode,
      successUrl,
      failureUrl,
    });

    if (!paymentSession.success) {
      console.error("💳 [VIVA INITIATE] Payment session creation failed:", paymentSession.error);
      return NextResponse.json(
        {
          success: false,
          error: paymentSession.error || "Failed to create payment session",
        },
        { status: 500 }
      );
    }

    console.log("💳 [VIVA INITIATE] Payment session created successfully:", {
      success: true,
      paymentUrl: paymentSession.paymentUrl,
      transactionId: paymentSession.transactionId,
    });

    return NextResponse.json({
      success: true,
      paymentUrl: paymentSession.paymentUrl,
      transactionId: paymentSession.transactionId,
    });
  } catch (error) {
    console.error("Error initiating Viva payment:", error);
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
