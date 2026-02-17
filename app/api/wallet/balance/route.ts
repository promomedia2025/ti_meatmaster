import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Get customer_id from query parameters (optional - can use cookie instead)
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get("customer_id") || searchParams.get("user_id");

    // Get cookies from the request (for TastyIgniter session)
    const cookieHeader = request.headers.get("cookie") || "";

    // Build the API URL
    let apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/wallet/balance`;
    
    // If customer_id is provided, add it as a query parameter
    if (customerId) {
      apiUrl += `?customer_id=${customerId}`;
    }

    // Prepare headers
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Forward cookies if available (for TastyIgniter session authentication)
    if (cookieHeader) {
      headers["Cookie"] = cookieHeader;
    }

    // Make the request to the backend API
    const response = await fetch(apiUrl, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    // Get response data
    const data = await response.json();

    // Console.log the response as requested
    console.log("💰 Wallet Balance API Response:");
    console.log("Status:", response.status);
    console.log("Response Data:", JSON.stringify(data, null, 2));

    // Return the response
    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to fetch wallet balance",
          error: data.error || `API request failed with status: ${response.status}`,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Error fetching wallet balance:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch wallet balance",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
