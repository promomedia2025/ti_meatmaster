import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const menuId = params.id;

    if (!menuId) {
      return NextResponse.json(
        {
          success: false,
          error: "menu_id parameter is required",
        },
        { status: 400 }
      );
    }

    // Make request to the external API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/menu-items/${menuId}/options`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
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

    // Return the data as-is
    return NextResponse.json(data);
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
