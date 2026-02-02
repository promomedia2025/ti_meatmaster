import { NextRequest, NextResponse } from "next/server";
import { createPiraeusPaymentRequest } from "@/lib/piraeus-payment";

export const dynamic = "force-dynamic";

/**
 * API Route: Initiate Piraeus Bank Payment
 * 
 * This endpoint creates a payment request and returns form data
 * to submit via POST to Piraeus Bank's payment gateway.
 * The form includes all credentials as hidden fields.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      orderId,
      amount,
      currency = "EUR",
      description,
      customerEmail,
      customerName,
      customerPhone,
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

    // Get base URL for callback URLs
    const baseUrl = request.nextUrl.origin;
    // Use language from request body, or extract from referer, or default to 'el'
    const language = lang || (() => {
      const referer = request.headers.get("referer") || "";
      const langMatch = referer.match(/\/(el|en)\//);
      return langMatch ? langMatch[1] : "el";
    })();
    const returnUrl = `${baseUrl}/api/payments/piraeus/callback?orderId=${encodeURIComponent(orderId)}&lang=${language}`;
    const cancelUrl = `${baseUrl}/api/payments/piraeus/callback?orderId=${encodeURIComponent(orderId)}&cancelled=true&lang=${language}`;

    // Create payment request
    const paymentRequest = createPiraeusPaymentRequest({
      orderId: orderId.toString(),
      amount: amountNum,
      currency,
      description,
      customerEmail,
      customerName,
      customerPhone,
      returnUrl,
      cancelUrl,
    });

    if (!paymentRequest.success) {
      return NextResponse.json(
        {
          success: false,
          error: paymentRequest.error || "Failed to create payment request",
        },
        { status: 500 }
      );
    }

    // Return form data for POST submission
    return NextResponse.json({
      success: true,
      formData: paymentRequest.formData,
      gatewayUrl: paymentRequest.gatewayUrl,
      transactionId: paymentRequest.transactionId,
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

