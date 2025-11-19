import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, remember } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
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
    console.log(csrfToken);
    // Make the request to the external API from the server
    const response = await fetch(
      "https://multitake.bettersolution.gr/api/auth/customer/login",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken && { "X-CSRF-TOKEN": csrfToken }),
        },
        body: JSON.stringify({
          email,
          password,
          remember,
        }),
      }
    );

    const data = await response.json();

    // Debug: Log all response data from external API
    console.log("🔍 External API response status:", response.status);
    console.log(
      "🔍 External API response data:",
      JSON.stringify(data, null, 2)
    );
    console.log("🔍 External API response headers:");
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }

    if (response.ok) {
      // Create response with data
      const response_data = NextResponse.json({
        success: true,
        data: data,
      });

      // Forward cookies from external API to the client
      const setCookieHeader = response.headers.get("set-cookie");
      console.log("🍪 Set-Cookie header from external API:", setCookieHeader);

      if (setCookieHeader) {
        // Extract and log cookie expiration information
        const maxAgeMatch = setCookieHeader.match(/Max-Age=(\d+)/i);
        const expiresMatch = setCookieHeader.match(/Expires=([^;]+)/i);

        if (maxAgeMatch) {
          const maxAgeSeconds = parseInt(maxAgeMatch[1]);
          const maxAgeHours = Math.floor(maxAgeSeconds / 3600);
          const maxAgeDays = Math.floor(maxAgeHours / 24);
          console.log(
            `🍪 Cookie Max-Age: ${maxAgeSeconds} seconds (${maxAgeHours} hours, ${maxAgeDays} days)`
          );
        }

        if (expiresMatch) {
          const expiresDate = new Date(expiresMatch[1]);
          console.log(
            `🍪 Cookie Expires: ${expiresDate.toISOString()} (${expiresDate.toLocaleString()})`
          );
        }

        // Parse and modify Laravel session cookies for localhost
        const cookies = setCookieHeader.split(",").map((cookie) => {
          // Remove domain restrictions and make it work for localhost
          return cookie
            .replace(/Domain=[^;]+/gi, "") // Remove domain restriction
            .replace(/Secure/gi, "") // Remove secure flag for localhost
            .replace(/SameSite=[^;]+/gi, "SameSite=Lax") // Set to Lax for localhost
            .trim();
        });

        const modifiedCookies = cookies.join(", ");
        console.log("🍪 Modified cookies for localhost:", modifiedCookies);
        response_data.headers.set("set-cookie", modifiedCookies);
      } else {
        console.log("❌ No Set-Cookie header found in external API response");
      }

      return response_data;
    } else {
      return NextResponse.json(
        {
          success: false,
          error: data.message || "Login failed",
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
