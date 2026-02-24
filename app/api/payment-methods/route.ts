import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * API Route: Get available payment methods
 * 
 * Returns which payment methods are enabled based on environment configuration.
 * Card payments are disabled when VIVA_ENVIRONMENT is "demo".
 */
export async function GET(request: NextRequest) {
  try {
    const vivaEnvironment = process.env.VIVA_ENVIRONMENT || "demo";
    const isCardPaymentEnabled = vivaEnvironment !== "demo";

    return NextResponse.json({
      success: true,
      data: {
        card: isCardPaymentEnabled,
        cash: true, // Cash is always enabled
      },
    });
  } catch (error) {
    console.error("Error fetching payment methods:", error);
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
