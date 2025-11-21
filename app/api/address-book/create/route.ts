import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Verify CSRF token from request headers
    const requestCsrfToken = request.headers.get("x-csrf-token");
    if (!requestCsrfToken) {
      return NextResponse.json(
        {
          success: false,
          message: "CSRF token is required",
          error: "Missing CSRF token in headers",
        },
        { status: 403 }
      );
    }

    // For now, we'll accept any CSRF token since the current implementation
    // generates a new token on each request. In a production app, you'd want
    // to validate against a stored session token.
    console.log("🔐 CSRF token received:", requestCsrfToken);

    const body = await request.json();
    console.log(
      "📥 Address creation request body:",
      JSON.stringify(body, null, 2)
    );

    const {
      customer_id,
      address_1,
      address_2,
      city,
      state,
      postcode,
      country,
      is_default,
    } = body;

    // Validation
    if (!customer_id) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer ID is required",
          error: "Missing customer_id in request body",
        },
        { status: 400 }
      );
    }

    if (!address_1 || !city || !postcode || !country) {
      return NextResponse.json(
        {
          success: false,
          message: "Required fields are missing",
          error: "address_1, city, postcode, and country are required",
        },
        { status: 400 }
      );
    }

    // Forward to external API
    const apiUrl = `https://cocofino.bettersolution.gr/api/address-book/create`;
    console.log("📝 Creating address via API:", apiUrl);
    console.log("📤 Request body:", {
      customer_id,
      address_1,
      address_2: address_2 || "",
      city,
      state: state || "",
      postcode,
      country,
      is_default: is_default || false,
    });

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer_id,
        address_1,
        address_2: address_2 || "",
        city,
        state: state || "",
        postcode,
        country,
        is_default: is_default || false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ External API error:", response.status, errorText);
      throw new Error(`External API responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Address created successfully:", data);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating address:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create address",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
