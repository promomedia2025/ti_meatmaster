import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  try {
    // Parse the request body to get user_id and location_id
    const body = await request.json();
    const userId = body.user_id;
    const locationId = body.location_id;

    if (!userId || !locationId) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing user_id or location_id",
          error: "VALIDATION_FAILED",
        },
        { status: 400 }
      );
    }

    // Call the external API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/cart/clear?user_id=${userId}&location_id=${locationId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const errorText = await response.text();
      console.error("External API error:", response.status, errorText);
      return NextResponse.json(
        {
          success: false,
          message: data.message || "Failed to clear cart",
          error: data.error || "CLEAR_CART_FAILED",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: data.message || "Cart cleared successfully",
      data: data.data,
    });
  } catch (error) {
    console.error("Error in cart clear API:", error);
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
