import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    console.log("📡 [admin/location-status] Incoming request", {
      method: request.method,
      url: request.url,
      searchParams: Object.fromEntries(
        new URL(request.url).searchParams.entries()
      ),
      nextLocationId: process.env.NEXT_LOCATION_ID,
      hasApiUrl: !!process.env.NEXT_PUBLIC_API_URL,
    });

    // Fetch location status from external API
    const targetUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/locations/${process.env.NEXT_LOCATION_ID}/status`;
    console.log("➡️ [admin/location-status] Fetching external status", {
      targetUrl,
    });

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [admin/location-status] API request failed", {
        status: response.status,
        errorText,
        targetUrl,
      });
      return NextResponse.json(
        {
          success: false,
          error: `API request failed with status: ${response.status}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    console.log("✅ [admin/location-status] Successfully fetched status", {
      targetUrl,
      hasData: !!data,
      keys: data ? Object.keys(data) : [],
    });

    return NextResponse.json({
      success: true,
      data: data.data, // Return the data object containing location and status
    });
  } catch (error) {
    console.error("❌ [admin/location-status] Error fetching location status:", error);
    if (error instanceof Error) {
      console.error("❌ Error message:", error.message);
      console.error("❌ Error stack:", error.stack);
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch location status" },
      { status: 500 }
    );
  }
}
