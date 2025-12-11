import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { menu_id, quantity, options, comment, location_id, user_id } = body;

    console.log("🛒 [SERVER] Cart add request received:", {
      menu_id,
      quantity,
      options,
      comment,
      location_id,
      user_id,
    });

    // Validate required fields
    if (!menu_id || !quantity || !location_id || !user_id) {
      console.log("🛒 [SERVER] ❌ Missing required fields");
      return NextResponse.json(
        {
          success: false,
          message:
            "Missing required fields: menu_id, quantity, location_id, user_id",
          error: "VALIDATION_FAILED",
        },
        { status: 422 }
      );
    }

    // Make request to external API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const response = await fetch(`${apiUrl}/api/cart/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        menu_id,
        quantity,
        options: options || [],
        comment: comment || "",
        location_id,
        user_id,
      }),
    });

    console.log("🛒 [SERVER] External API response:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    const data = await response.json();
    console.log("🛒 [SERVER] External API data:", data);

    if (response.ok && data.success) {
      console.log("🛒 [SERVER] ✅ Item added successfully");
      return NextResponse.json({
        success: true,
        message: "Item added to cart successfully",
        data: data.data,
      });
    } else {
      console.log("🛒 [SERVER] ❌ External API error:", data);
      return NextResponse.json(
        {
          success: false,
          message: data.message || "Failed to add item to cart",
          error: data.error || "EXTERNAL_API_ERROR",
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.log("🛒 [SERVER] ❌ Exception caught:");
    console.error("Cart add server error:", error);
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
