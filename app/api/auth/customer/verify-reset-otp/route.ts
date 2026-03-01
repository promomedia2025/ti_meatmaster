import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: "Email and OTP are required" },
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
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/customer/verify-reset-otp`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken && { "X-CSRF-TOKEN": csrfToken }),
        },
        body: JSON.stringify({ email, otp }),
      }
    );

    const data = await response.json();

    // Debug: Log all response data from external API
    console.log("🔍 Verify reset OTP API response status:", response.status);
    console.log(
      "🔍 Verify reset OTP API response data:",
      JSON.stringify(data, null, 2)
    );

    if (response.ok && data.success) {
      return NextResponse.json({
        success: true,
        code: data.code,
        redirect_url: data.redirect_url,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: data.message || data.error || "OTP verification failed",
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error("Verify reset OTP API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
