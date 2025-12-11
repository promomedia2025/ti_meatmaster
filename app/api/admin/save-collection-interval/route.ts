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
    const { collection_time_interval, location_id } = body;

    if (collection_time_interval === undefined || !location_id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: collection_time_interval and location_id",
        },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/helloworld/save-location-options`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${dashboardToken}`,
        },
        body: JSON.stringify({
          collection_time_interval,
          location_id,
        }),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
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
    return NextResponse.json(
      { success: false, error: "Failed to save collection interval" },
      { status: 500 }
    );
  }
}
