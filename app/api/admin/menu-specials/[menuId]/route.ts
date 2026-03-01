import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

// GET - Fetch menu special
export async function GET(
  request: NextRequest,
  { params }: { params: { menuId: string } }
) {
  try {
    const { menuId } = params;
    const cookieHeader = request.headers.get("cookie") || "";

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/menu-specials/${menuId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      // If 404, return null (no special exists yet)
      if (response.status === 404) {
        return NextResponse.json({
          success: true,
          data: null,
        });
      }

      const errorText = await response.text();
      console.error("❌ [Server] External API error:", errorText);
      return NextResponse.json(
        { success: false, error: "Failed to fetch menu special" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      data: data.data || data,
    });
  } catch (error) {
    console.error("❌ [Server] Error fetching menu special:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST - Create or update menu special
export async function POST(
  request: NextRequest,
  { params }: { params: { menuId: string } }
) {
  try {
    const { menuId } = params;
    const body = await request.json();
    const cookieHeader = request.headers.get("cookie") || "";

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/menu-specials/${menuId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
        credentials: "include",
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [Server] External API error:", errorText);
      return NextResponse.json(
        { success: false, error: "Failed to save menu special" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Invalidate cached menu items so any cached pages using this data are updated
    revalidateTag("admin-menu-items");

    return NextResponse.json({
      success: true,
      data: data.data || data,
    });
  } catch (error) {
    console.error("❌ [Server] Error saving menu special:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete menu special
export async function DELETE(
  request: NextRequest,
  { params }: { params: { menuId: string } }
) {
  try {
    const { menuId } = params;
    const cookieHeader = request.headers.get("cookie") || "";

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/menu-specials/${menuId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [Server] External API error:", errorText);
      return NextResponse.json(
        { success: false, error: "Failed to delete menu special" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Invalidate cached menu items so any cached pages using this data are updated
    revalidateTag("admin-menu-items");

    return NextResponse.json({
      success: true,
      data: data.data || data,
    });
  } catch (error) {
    console.error("❌ [Server] Error deleting menu special:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
