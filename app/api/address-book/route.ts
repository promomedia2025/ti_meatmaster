import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Extract user_id from query parameters or headers
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
          error: "Missing user_id parameter",
        },
        { status: 400 }
      );
    }

    const apiUrl = `https://multitake.bettersolution.gr/api/address-book/${userId}`;
    console.log("🔍 API URL:", apiUrl);
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`External API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching address book:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch address book",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
