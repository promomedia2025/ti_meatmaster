import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { menu_id, menu_status } = body;

    if (!menu_id || typeof menu_status !== "boolean") {
      return NextResponse.json(
        { success: false, error: "menu_id and menu_status are required" },
        { status: 400 }
      );
    }

    // Get cookies from the request
    const cookieHeader = request.headers.get("cookie") || "";

    // Convert boolean to 1/0 for the API
    const statusValue = menu_status ? 1 : 0;

    console.log("🔍 [Server] Toggling menu status");
    console.log("🔍 [Server] Menu ID:", menu_id);
    console.log("🔍 [Server] New status (boolean):", menu_status);
    console.log("🔍 [Server] New status (API format):", statusValue);
    console.log("🔍 [Server] Cookie header present:", !!cookieHeader);

    // Forward the request to the external API with credentials
    const response = await fetch(
      "https://cocofino.bettersolution.gr/admin/helloworld/toggle-menu-status",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
        credentials: "include",
        body: JSON.stringify({
          menu_id,
          status: statusValue,
        }),
      }
    );

    console.log("🔍 [Server] External API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [Server] External API error:", errorText);
      return NextResponse.json(
        { success: false, error: "Failed to toggle menu status" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("✅ [Server] Menu status toggled successfully");
    console.log("✅ [Server] Response data:", JSON.stringify(data, null, 2));

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("❌ [Server] Error toggling menu status:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
