import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * API Route: Piraeus Bank Authorize
 *
 * This endpoint receives JSON data and forwards it exactly as-is
 * to the cocofino.bettersolution.gr/piraeusbank/authorize backend API route.
 */
export async function POST(request: NextRequest) {
  try {
    // Get the raw request body
    const requestBody = await request.text();

    // Parse JSON for better logging
    let parsedData;
    try {
      parsedData = JSON.parse(requestBody);
    } catch (e) {
      parsedData = requestBody;
    }

    // Forward the request to the backend API exactly as received
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/piraeusbank/authorize`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: requestBody,
      }
    );

    // Get the response from the backend API
    const responseText = await response.text();
    const responseData = JSON.parse(responseText);

    // Return the response from the backend API
    return NextResponse.json(responseData, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}