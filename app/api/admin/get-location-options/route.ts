import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json().catch(() => ({}));
    const { location_id } = requestBody;

    console.log("📤 [get-location-options] Request received:", {
      requestBody,
      location_id,
    });

    if (!location_id) {
      console.log("❌ [get-location-options] Missing location_id");
      return NextResponse.json(
        {
          success: false,
          error: "location_id is required",
        },
        { status: 400 }
      );
    }

    const response = await fetch(
      "https://cocofino.bettersolution.gr/admin/helloworld/get-location-options",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location_id: location_id,
        }),
        cache: "no-store",
      }
    );

    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.log("❌ [get-location-options] Failed to parse response:", {
        status: response.status,
        statusText: response.statusText,
        responseText,
      });
      return NextResponse.json(
        {
          success: false,
          error: `Invalid response from API: ${response.status}`,
        },
        { status: response.status }
      );
    }

    console.log("✅ [get-location-options] API Response:", {
      status: response.status,
      statusText: response.statusText,
      responseData: data,
      success: data.success,
      options: data.options || {},
      message: data.message,
    });

    // Handle API response structure
    if (!data.success) {
      console.log("❌ [get-location-options] API returned success: false:", {
        message: data.message,
      });
      return NextResponse.json(
        {
          success: false,
          error: data.message || "Failed to fetch location options",
        },
        { status: response.ok ? 200 : response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: data.options || {},
    });
  } catch (error) {
    console.error("💥 [get-location-options] Error:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { success: false, error: "Failed to fetch location options" },
      { status: 500 }
    );
  }
}
