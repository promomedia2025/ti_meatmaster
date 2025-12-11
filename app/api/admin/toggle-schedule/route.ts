import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const dashboardToken = process.env.DASHBOARD_TOKEN;

    if (!dashboardToken) {
      return NextResponse.json(
        { success: false, error: "Dashboard token not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { status, location_id } = body;

    if (status === undefined || !location_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: status and location_id",
        },
        { status: 400 }
      );
    }

    // Make request to the external API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/helloworld/toggle-all-schedules`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${dashboardToken}`,
        },
        body: JSON.stringify({
          status,
          location_id,
        }),
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

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("❌ Error toggling schedule:", error);
    if (error instanceof Error) {
      console.error("❌ Error message:", error.message);
      console.error("❌ Error stack:", error.stack);
    }
    return NextResponse.json(
      { success: false, error: "Failed to toggle schedule" },
      { status: 500 }
    );
  }
}
