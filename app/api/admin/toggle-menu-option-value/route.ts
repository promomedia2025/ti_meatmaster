import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  console.log("📥 [TOGGLE-MENU-OPTION-VALUE] API route called");

  try {
    const body = await request.json();
    const { menu_option_value_id, is_enabled } = body;

    console.log("📥 [TOGGLE-MENU-OPTION-VALUE] Request body received:", {
      menu_option_value_id,
      is_enabled,
      hasMenuOptionValueId: !!menu_option_value_id,
      hasIsEnabled: is_enabled !== undefined,
    });

    if (!menu_option_value_id || is_enabled === undefined) {
      console.error("❌ [TOGGLE-MENU-OPTION-VALUE] Missing required fields:", {
        menu_option_value_id: !!menu_option_value_id,
        is_enabled: is_enabled !== undefined,
      });
      return NextResponse.json(
        {
          success: false,
          error: "menu_option_value_id and is_enabled are required",
        },
        { status: 400 }
      );
    }

    // Get cookies from the request to forward to external API
    const cookies = request.headers.get("cookie") || "";
    const hasCookies = cookies.length > 0;
    console.log("🍪 [TOGGLE-MENU-OPTION-VALUE] Cookies present:", hasCookies);
    if (hasCookies) {
      const cookieNames = cookies.split(";").map((c) => c.trim().split("=")[0]);
      console.log("🍪 [TOGGLE-MENU-OPTION-VALUE] Cookie names:", cookieNames);
    }

    const requestPayload = {
      menu_option_value_id,
      is_enabled,
    };

    console.log("📤 [TOGGLE-MENU-OPTION-VALUE] Calling external API:", {
      url: `${process.env.NEXT_PUBLIC_API_URL}/admin/hellowworld/toggle-menu-option-value`,
      method: "POST",
      payload: requestPayload,
    });

    const fetchStartTime = Date.now();

    // Make request to the external API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/helloworld/toggle-menu-option-value`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookies,
        },
        body: JSON.stringify(requestPayload),
        cache: "no-store",
      }
    );

    const fetchDuration = Date.now() - fetchStartTime;
    console.log(
      "📥 [TOGGLE-MENU-OPTION-VALUE] External API response received:",
      {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        duration: `${fetchDuration}ms`,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "❌ [TOGGLE-MENU-OPTION-VALUE] External API request failed:",
        {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText.substring(0, 500),
          fullErrorText: errorText,
        }
      );
      return NextResponse.json(
        {
          success: false,
          error: `API request failed with status: ${response.status}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(
      "✅ [TOGGLE-MENU-OPTION-VALUE] External API success response:",
      {
        success: data.success,
        data: data,
        fullResponse: JSON.stringify(data, null, 2),
      }
    );

    console.log(
      "✅ [TOGGLE-MENU-OPTION-VALUE] Returning success response to client"
    );

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("❌ Error toggling menu option value:", error);
    if (error instanceof Error) {
      console.error("❌ Error message:", error.message);
      console.error("❌ Error stack:", error.stack);
    }
    return NextResponse.json(
      { success: false, error: "Failed to toggle menu option value" },
      { status: 500 }
    );
  }
}
