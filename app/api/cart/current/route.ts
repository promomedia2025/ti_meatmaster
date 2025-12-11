import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query parameters or session
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
          error: "USER_ID_REQUIRED",
        },
        { status: 400 }
      );
    }

    // Fetch current cart from BetterSolution API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/cart/current?user_id=${userId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching current cart:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch current cart",
        error: "CART_FETCH_FAILED",
      },
      { status: 500 }
    );
  }
}
