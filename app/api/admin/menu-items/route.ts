import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Get cookies from the request
    const cookieHeader = request.headers.get("cookie") || "";

    console.log("🔍 [Server] Fetching menu items from external API");
    console.log("🔍 [Server] Cookie header present:", !!cookieHeader);

    // Forward the request to the external API with credentials
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/helloworld/get-menu-items`,
      {
        method: "GET",
        headers: {
          Cookie: cookieHeader,
        },
        credentials: "include",
        cache: "no-store",
      }
    );

    console.log("🔍 [Server] External API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [Server] External API error:", errorText);
      return NextResponse.json(
        { success: false, error: "Failed to fetch menu items" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("✅ [Server] Menu items fetched successfully");
    console.log("✅ [Server] Menu items data:", JSON.stringify(data, null, 2));

    // Return the data as-is, preserving the structure (success, menuItems)
    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ [Server] Error fetching menu items:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
