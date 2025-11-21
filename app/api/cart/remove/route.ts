import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { row_id, user_id, location_id } = body;

    console.log("🛒 [SERVER] Cart remove request received:", {
      row_id,
      user_id,
      location_id,
    });

    // Validate required fields
    if (!row_id || !user_id) {
      console.log("🛒 [SERVER] ❌ Missing required fields");
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields: row_id, user_id",
          error: "VALIDATION_FAILED",
        },
        { status: 422 }
      );
    }

    // Make request to external API with rowId in URL and query parameters
    const url = `https://cocofino.bettersolution.gr/api/cart/remove/${row_id}?user_id=${user_id}${
      location_id ? `&location_id=${location_id}` : ""
    }`;
    console.log("🛒 [SERVER] External API URL:", url);

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("🛒 [SERVER] External API response:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    const data = await response.json();
    console.log("🛒 [SERVER] External API data:", data);

    if (response.ok && data.success) {
      console.log("🛒 [SERVER] ✅ Item removed successfully");
      return NextResponse.json({
        success: true,
        message: "Item removed from cart successfully",
        data: data.data,
      });
    } else {
      console.log("🛒 [SERVER] ❌ External API error:", data);
      return NextResponse.json(
        {
          success: false,
          message: data.message || "Failed to remove item from cart",
          error: data.error || "EXTERNAL_API_ERROR",
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.log("🛒 [SERVER] ❌ Exception caught:");
    console.error("Cart remove server error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
