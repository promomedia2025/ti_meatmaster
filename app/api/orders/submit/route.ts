import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json();

    // Get CSRF token from external API
    const csrfResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/csrf`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: request.headers.get("cookie") || "",
        },
      }
    );

    if (!csrfResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to get CSRF token: ${csrfResponse.status}`,
        },
        { status: 500 }
      );
    }

    let csrfData;
    try {
      csrfData = await csrfResponse.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Failed to parse CSRF token response" },
        { status: 500 }
      );
    }

    const csrfToken = csrfData.csrfToken || csrfData.csrf_token;

    if (!csrfToken) {
      return NextResponse.json(
        { success: false, error: "Invalid CSRF token response" },
        { status: 500 }
      );
    }

    // Forward cookies from the client request
    const cookieHeader = request.headers.get("cookie") || "";

    // Submit order to external API
    let response;
    try {
      response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/public/custom-orders/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": csrfToken,
            Cookie: cookieHeader,
          },
          body: JSON.stringify(orderData),
        }
      );
    } catch (fetchError) {
      console.error("Network error calling external API:", fetchError);
      return NextResponse.json(
        {
          success: false,
          error: "Network error: Could not reach the server. Please try again.",
        },
        { status: 503 }
      );
    }

    let result;
    try {
      const responseText = await response.text();
      if (!responseText) {
        throw new Error("Empty response from server");
      }
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Error parsing response:", parseError);
      return NextResponse.json(
        {
          success: false,
          error: `Server returned invalid response: ${response.status}`,
        },
        { status: 500 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            result.message ||
            `API request failed with status: ${response.status}`,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data || result,
    });
  } catch (error) {
    console.error("Error submitting order:", error);
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
