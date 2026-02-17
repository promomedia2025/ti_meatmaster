import { NextRequest, NextResponse } from "next/server";
import { getVivaTransaction } from "@/lib/viva-payment";

export const dynamic = "force-dynamic";

/**
 * API Route: Get Viva Payments Transaction Details
 * 
 * This endpoint fetches transaction details from Viva Payments Transaction API
 * using OAuth2 authentication. Used by client-side pages to verify payment status.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const transactionId = searchParams.get("transactionId");

    if (!transactionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Transaction ID is required",
        },
        { status: 400 }
      );
    }

    console.log("💳 [VIVA TRANSACTION API] Fetching transaction:", transactionId);

    // Fetch transaction details from Viva Payments Transaction API
    const transaction = await getVivaTransaction(transactionId);

    if (!transaction) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch transaction details or transaction not found",
        },
        { status: 404 }
      );
    }

    console.log("💳 [VIVA TRANSACTION API] Transaction fetched successfully:", {
      transactionId: transaction.transactionId,
      orderId: transaction.orderId,
      status: transaction.status,
    });

    return NextResponse.json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error("Error fetching Viva transaction:", error);
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
