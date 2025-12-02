import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = params.id;

    if (!customerId) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer ID is required",
          error: "Missing customer ID parameter",
        },
        { status: 400 }
      );
    }

    const apiUrl = `https://cocofino.bettersolution.gr/api/address-book/${customerId}`;
    console.log("🔍 API URL:", apiUrl);
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store", // Don't cache - always fetch fresh data
    });

    if (!response.ok) {
      throw new Error(`External API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching address book:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch address book",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

