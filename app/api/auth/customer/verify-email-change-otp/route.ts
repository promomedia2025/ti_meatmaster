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

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { success: false, error: "OTP must be 6 digits" },
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
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/customer/verify-email-change-otp`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken && { "X-CSRF-TOKEN": csrfToken }),
          Cookie: request.headers.get("cookie") || "",
        },
        body: JSON.stringify({ email, otp }),
      }
    );

    const data = await response.json();

    if (response.ok && data.success) {
      // Forward cookies from external API to the client
      const setCookieHeader = response.headers.get("set-cookie");
      const response_data = NextResponse.json({
        success: true,
        data: data.data || data,
      });

      if (setCookieHeader) {
        // Parse and modify Laravel session cookies for localhost
        const cookies = setCookieHeader.split(",").map((cookie) => {
          return cookie
            .replace(/Domain=[^;]+/gi, "")
            .replace(/Secure/gi, "")
            .replace(/SameSite=[^;]+/gi, "SameSite=Lax")
            .trim();
        });

        const modifiedCookies = cookies.join(", ");
        response_data.headers.set("set-cookie", modifiedCookies);
      }

      return response_data;
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
    console.error("Verify email change OTP API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
