import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { user_id: string } }
) {
  try {
    const userId = params.user_id;

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

    // Fetch user's entire cart from BetterSolution API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const response = await fetch(`${apiUrl}/api/cart/user/${userId}/all`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Error fetching user cart:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch user cart",
        error: "USER_CART_FETCH_FAILED",
      },
      { status: 500 }
    );
  }
}
