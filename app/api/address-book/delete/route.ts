import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
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

    console.log("🔐 CSRF token received:", requestCsrfToken);

    // Get address_id from query parameters
    const searchParams = request.nextUrl.searchParams;
    const addressId = searchParams.get("address_id");

    if (!addressId) {
      return NextResponse.json(
        {
          success: false,
          message: "Address ID is required",
          error: "Missing address_id parameter",
        },
        { status: 400 }
      );
    }

    // Forward to external API
    const apiUrl = `https://cocofino.bettersolution.gr/api/address-book/address/${addressId}`;
    console.log("🗑️ Deleting address via API:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ External API error:", response.status, errorText);
      throw new Error(`External API responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Address deleted successfully:", data);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete address",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
