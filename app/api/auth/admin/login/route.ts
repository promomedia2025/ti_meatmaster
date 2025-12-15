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
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/admin/login`,
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
        // Log the full Set-Cookie header for debugging
        console.log("🍪 Admin login - Full Set-Cookie header:", setCookieHeader);

        // Extract cookie name(s) from set-cookie header for logging
        const cookieNames = setCookieHeader.split(",").map((cookie) => {
          const cookiePart = cookie.trim().split(";")[0];
          return cookiePart.split("=")[0];
        });
        console.log(
          "🍪 Admin login - Cookie names from set-cookie header:",
          cookieNames
        );

        // Parse each cookie separately to check for expiration
        const parsedCookies = setCookieHeader.split(",").map((cookie) => cookie.trim());
        console.log("🍪 Admin login - Parsed cookies:", parsedCookies);

        // Extract and log cookie expiration information
        const maxAgeMatch = setCookieHeader.match(/Max-Age=(\d+)/i);
        const expiresMatch = setCookieHeader.match(/Expires=([^;]+)/i);
        
        // Also check each individual cookie
        for (const cookie of parsedCookies) {
          const cookieMaxAge = cookie.match(/Max-Age=(\d+)/i);
          const cookieExpires = cookie.match(/Expires=([^;]+)/i);
          if (cookieMaxAge) {
            console.log(`🍪 Found Max-Age in cookie: ${cookieMaxAge[0]}`);
          }
          if (cookieExpires) {
            console.log(`🍪 Found Expires in cookie: ${cookieExpires[0]}`);
          }
        }

        if (maxAgeMatch) {
          const maxAgeSeconds = parseInt(maxAgeMatch[1]);
          const maxAgeHours = Math.floor(maxAgeSeconds / 3600);
          const maxAgeDays = Math.floor(maxAgeHours / 24);
          console.log(
            `🍪 Admin cookie Max-Age: ${maxAgeSeconds} seconds (${maxAgeHours} hours, ${maxAgeDays} days)`
          );
        }

        if (expiresMatch) {
          const expiresDate = new Date(expiresMatch[1]);
          console.log(
            `🍪 Admin cookie Expires: ${expiresDate.toISOString()} (${expiresDate.toLocaleString()})`
          );
        }

        if (!maxAgeMatch && !expiresMatch) {
          console.log(
            "⚠️ Admin cookie - No Max-Age or Expires found. This is likely a session cookie that expires when the browser closes."
          );
        }

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
