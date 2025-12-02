import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { menu_id, menu_status } = body;

    console.log("📥 [toggle-menu-status] Incoming request body from client:", {
      body: body,
      bodyString: JSON.stringify(body),
    });

    // Get cookies from the request
    const cookieHeader = request.headers.get("cookie") || "";

    // Convert boolean to 1/0 for the API
    const statusValue = menu_status ? 1 : 0;

    const requestBody = {
      menu_id,
      status: statusValue,
    };

    console.log("🔍 [Server] Toggling menu status");
    console.log("🔍 [Server] Menu ID:", menu_id);
    console.log("🔍 [Server] New status (boolean):", menu_status);
    console.log("🔍 [Server] New status (API format):", statusValue);
    console.log("🔍 [Server] Cookie header present:", !!cookieHeader);
    console.log("📤 [toggle-menu-status] Request body to external API:", {
      body: requestBody,
      bodyString: JSON.stringify(requestBody),
    });

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
        body: JSON.stringify(requestBody),
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

    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("❌ [toggle-menu-status] Failed to parse response:", {
        responseText,
        parseError,
      });
      return NextResponse.json(
        { success: false, error: "Invalid response from API" },
        { status: 500 }
      );
    }

    console.log("✅ [toggle-menu-status] Menu status toggled successfully");
    console.log("✅ [toggle-menu-status] Response status:", response.status);
    console.log("✅ [toggle-menu-status] Response body:", {
      rawResponse: responseText,
      parsedData: data,
      dataString: JSON.stringify(data, null, 2),
    });

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
