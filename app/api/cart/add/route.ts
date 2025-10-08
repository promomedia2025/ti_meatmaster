import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { menu_id, quantity, options, comment, location_id } = body;

    if (!menu_id || !quantity) {
      return NextResponse.json(
        {
          success: false,
          message: "Menu ID and quantity are required",
          error: "VALIDATION_FAILED",
        },
        { status: 422 }
      );
    }

    // Fetch menu item data from BetterSolution API
    let menuItem = null;

    if (location_id) {
      // Fetch menu items for the specific location
      const menuResponse = await fetch(
        `https://multitake.bettersolution.gr/api/locations/${location_id}/menu-items`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (menuResponse.ok) {
        const menuData = await menuResponse.json();
        if (menuData.success && menuData.data.menu_items) {
          menuItem = menuData.data.menu_items.find(
            (item: any) => item.menu_id === menu_id
          );
        }
      }
    }

    if (!menuItem) {
      return NextResponse.json(
        {
          success: false,
          message: "Menu item not found",
          error: "MENU_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // Generate a unique row ID for the cart item
    const rowId = `${menu_id}_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Calculate subtotal
    const subtotal = menuItem.menu_price * quantity;

    // Create cart item response using real menu data
    const cartItem = {
      rowId,
      id: menuItem.menu_id,
      name: menuItem.menu_name,
      qty: quantity,
      price: menuItem.menu_price,
      subtotal,
      options: options || [],
      comment: comment || "",
    };

    // Mock cart summary - in a real app this would be calculated from the actual cart
    const cartSummary = {
      count: 1, // This would be the actual count from the cart
      subtotal: subtotal,
      total: subtotal,
    };

    return NextResponse.json(
      {
        success: true,
        message: "Item added to cart successfully",
        data: {
          cart_item: cartItem,
          cart_summary: cartSummary,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Cart add error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to add item to cart",
        error: "CART_ADD_FAILED",
      },
      { status: 500 }
    );
  }
}
