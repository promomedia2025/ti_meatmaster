import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      first_name,
      last_name,
      email,
      password,
      password_confirmation,
      telephone,
    } = body;

    // Validate required fields with specific messages
    if (!first_name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Το όνομα είναι υποχρεωτικό" },
        { status: 400 }
      );
    }

    if (!last_name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Το επώνυμο είναι υποχρεωτικό" },
        { status: 400 }
      );
    }

    if (!email?.trim()) {
      return NextResponse.json(
        { success: false, error: "Το email είναι υποχρεωτικό" },
        { status: 400 }
      );
    }

    if (!telephone?.trim()) {
      return NextResponse.json(
        { success: false, error: "Το τηλέφωνο είναι υποχρεωτικό" },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Ο κωδικός πρόσβασης είναι υποχρεωτικός" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: "Ο κωδικός πρόσβασης πρέπει να έχει τουλάχιστον 6 χαρακτήρες",
        },
        { status: 400 }
      );
    }

    // Validate password confirmation
    if (password !== password_confirmation) {
      return NextResponse.json(
        { success: false, error: "Οι κωδικοί πρόσβασης δεν ταιριάζουν" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Παρακαλώ εισάγετε ένα έγκυρο email" },
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

    console.log("CSRF Token:", csrfToken);

    // Make the request to the external API from the server
    const response = await fetch(
      "https://multitake.bettersolution.gr/api/auth/customer/register",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken && { "X-CSRF-TOKEN": csrfToken }),
        },
        body: JSON.stringify({
          first_name,
          last_name,
          email,
          password,
          password_confirmation,
          telephone,
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
          error: data.message || "Registration failed",
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error("Register API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
