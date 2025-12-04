import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("🔐 Admin login - Request body:", body);
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Make the request to the external admin login API
    const response = await fetch(
      "https://cocofino.bettersolution.gr/api/auth/admin/login",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      // Create response with data
      const response_data = NextResponse.json({
        success: true,
        data: data,
      });

      // Forward cookies from external API to the client
      const setCookieHeader = response.headers.get("set-cookie");

      if (setCookieHeader) {
        // Extract cookie name(s) from set-cookie header for logging
        const cookieNames = setCookieHeader.split(",").map((cookie) => {
          const cookiePart = cookie.trim().split(";")[0];
          return cookiePart.split("=")[0];
        });
        console.log(
          "🍪 Admin login - Cookie names from set-cookie header:",
          cookieNames
        );

        // Parse and modify cookies for localhost
        const cookies = setCookieHeader.split(",").map((cookie) => {
          // Remove domain restrictions and make it work for localhost
          return cookie
            .replace(/Domain=[^;]+/gi, "") // Remove domain restriction
            .replace(/Secure/gi, "") // Remove secure flag for localhost
            .replace(/SameSite=[^;]+/gi, "SameSite=Lax") // Set to Lax for localhost
            .trim();
        });

        const modifiedCookies = cookies.join(", ");
        response_data.headers.set("set-cookie", modifiedCookies);
      } else {
        console.log("⚠️ Admin login - No set-cookie header in response");
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
    console.error("Admin login API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
