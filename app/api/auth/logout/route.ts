import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Get CSRF token first
    const csrfResponse = await fetch(`${request.nextUrl.origin}/api/csrf`);
    let csrfToken = null;

    if (csrfResponse.ok) {
      const csrfData = await csrfResponse.json();
      csrfToken = csrfData.csrfToken;
    }

    // Make the request to the external API to logout
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken && { "X-CSRF-TOKEN": csrfToken }),
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      // Create response with data
      const response_data = NextResponse.json({
        success: true,
        data: data,
      });

      // Forward cookies from external API to the client (for logout)
      const setCookieHeader = response.headers.get("set-cookie");
      if (setCookieHeader) {
        console.log(
          "🍪 Forwarding logout cookies from external API:",
          setCookieHeader
        );
        response_data.headers.set("set-cookie", setCookieHeader);
      }

      return response_data;
    } else {
      return NextResponse.json(
        {
          success: false,
          error: data.message || "Logout failed",
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error("Logout API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
