import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("🛒 [UPDATE CART] Received request body:", body);

    const { row_id, quantity, qty, options, comment, user_id, location_id } =
      body;

    // Support both 'quantity' and 'qty' for backward compatibility

    const finalQuantity = quantity || qty;

    // Validate row_id is in the URL path, not body

    // Extract row_id from URL if provided in path, otherwise use body

    const urlPath = request.url;

    const rowIdFromPath = urlPath.match(/\/update\/([^\/\?]+)/)?.[1];

    const finalRowId = rowIdFromPath || row_id;

    console.log("🛒 [UPDATE CART] Extracted fields:", {
      row_id,

      quantity: finalQuantity,

      options,

      comment,

      user_id,

      location_id,

      row_id_type: typeof row_id,

      quantity_type: typeof finalQuantity,

      user_id_type: typeof user_id,

      location_id_type: typeof location_id,
    });

    // Validate required fields (check for undefined, null, or empty string)

    if (
      finalRowId === undefined ||
      finalRowId === null ||
      finalRowId === "" ||
      finalQuantity === undefined ||
      finalQuantity === null ||
      user_id === undefined ||
      user_id === null ||
      user_id === "" ||
      location_id === undefined ||
      location_id === null ||
      location_id === ""
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Missing required fields: row_id, quantity, user_id, location_id",
        },

        { status: 400 }
      );
    }

    // Validate quantity

    if (finalQuantity < 0) {
      return NextResponse.json(
        {
          success: false,

          message: "Quantity cannot be negative",
        },

        { status: 400 }
      );
    }

    console.log("🛒 [UPDATE CART] Server-side update:", {
      row_id: finalRowId,

      quantity: finalQuantity,

      options,

      comment,

      user_id,

      location_id,
    });

    // Call external API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const response = await fetch(
      `${apiUrl}/api/cart/update/${finalRowId}`,

      {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          qty: finalQuantity,

          options: options || [],

          comment: comment || "",

          user_id,

          location_id,
        }),
      }
    );

    const data = await response.json();

    console.log("🛒 [UPDATE CART] External API response:", {
      status: response.status,

      ok: response.ok,

      data: data,
    });

    if (!response.ok) {
      console.error("🛒 [UPDATE CART] External API error:", {
        status: response.status,

        data,
      });

      return NextResponse.json(
        {
          success: false,

          message: data.message || "Failed to update cart item",
        },

        { status: response.status }
      );
    }

    console.log("🛒 [UPDATE CART] External API success:", data);

    return NextResponse.json({
      success: true,

      message: "Cart item updated successfully",

      data,
    });
  } catch (error) {
    console.error("🛒 [UPDATE CART] Server error:", error);

    return NextResponse.json(
      {
        success: false,

        message: "Internal server error",
      },

      { status: 500 }
    );
  }
}
