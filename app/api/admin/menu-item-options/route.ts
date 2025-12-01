import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const menuId = searchParams.get("menu_id");

    if (!menuId) {
      return NextResponse.json(
        {
          success: false,
          error: "menu_id parameter is required",
        },
        { status: 400 }
      );
    }

    // Get cookies from the request to forward to external API
    const cookies = request.headers.get("cookie") || "";

    // Make request to the external API
    const response = await fetch(
      `https://cocofino.bettersolution.gr/admin/helloworld/get-menu-item-options?menu_id=${menuId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookies,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API request failed:", response.status, errorText);
      return NextResponse.json(
        {
          success: false,
          error: `API request failed with status: ${response.status}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Handle different response formats
    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("❌ Error fetching menu item options:", error);
    if (error instanceof Error) {
      console.error("❌ Error message:", error.message);
      console.error("❌ Error stack:", error.stack);
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch menu item options" },
      { status: 500 }
    );
  }
}
