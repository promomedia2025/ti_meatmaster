import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, password, password_confirmation } = body;

    if (!code || !password || !password_confirmation) {
      return NextResponse.json(
        {
          success: false,
          error: "Code, password, and password confirmation are required",
        },
        { status: 400 }
      );
    }

    if (password !== password_confirmation) {
      return NextResponse.json(
        {
          success: false,
          error: "Passwords do not match",
        },
        { status: 400 }
      );
    }

    // Get CSRF token first
    const csrfResponse = await fetch(`${request.nextUrl.origin}/api/csrf`);
    let csrfToken = null;

    if (csrfResponse.ok) {
      const csrfData = await csrfResponse.json();
      csrfToken = csrfData.csrfToken;
    }

    // Make the request to the external API from the server
    const response = await fetch(
      "https://multitake.bettersolution.gr/api/auth/customer/reset",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken && { "X-CSRF-TOKEN": csrfToken }),
        },
        body: JSON.stringify({
          code,
          password,
          password_confirmation,
        }),
      }
    );

    const data = await response.json();

    // Debug: Log all response data from external API
    console.log("🔍 Password reset API response status:", response.status);
    console.log(
      "🔍 Password reset API response data:",
      JSON.stringify(data, null, 2)
    );

    if (response.ok) {
      return NextResponse.json({
        success: true,
        data: data,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: data.message || data.error || "Password reset failed",
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error("Password reset API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}













