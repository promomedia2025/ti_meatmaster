import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: { menuId: string } }
) {
  try {
    const menuId = params.menuId;
    const body = await request.json();
    const { price } = body;

    if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      return NextResponse.json(
        { success: false, error: "Valid price is required" },
        { status: 400 }
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      return NextResponse.json(
        { success: false, error: "API URL not configured" },
        { status: 500 }
      );
    }

    // Get CSRF token
    const csrfResponse = await fetch(`${request.nextUrl.origin}/api/csrf`);
    let csrfToken = null;
    if (csrfResponse.ok) {
      const csrfData = await csrfResponse.json();
      csrfToken = csrfData.csrfToken;
    }

    // Get cookies from the request
    const cookieHeader = request.headers.get("cookie") || "";

    const response = await fetch(
      `${apiUrl}/api/menu-items/${menuId}/price`,
      {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken && { "X-CSRF-TOKEN": csrfToken }),
          Cookie: cookieHeader,
        },
        body: JSON.stringify({ price: parseFloat(price) }),
      }
    );

    const data = await response.json();

    if (response.ok && data.success) {
      // Invalidate cache for menu items
      revalidateTag("admin-menu-items");
      
      return NextResponse.json({
        success: true,
        message: data.message || "Menu item price updated successfully",
        data: data.data || {
          menu_id: parseInt(menuId),
          menu_name: data.data?.menu_name || "",
          price: parseFloat(price),
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: data.error || data.message || "Failed to update menu item price",
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error("Error updating menu item price:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
