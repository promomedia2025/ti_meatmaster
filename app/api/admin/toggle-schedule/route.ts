import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const dashboardToken = process.env.DASHBOARD_TOKEN;

    console.log("📡 [admin/toggle-schedule] Incoming request", {
      method: request.method,
      url: request.url,
      hasDashboardToken: !!dashboardToken,
      dashboardTokenLength: dashboardToken?.length ?? 0,
      hasApiUrl: !!process.env.NEXT_PUBLIC_API_URL,
    });

    if (!dashboardToken) {
      console.error(
        "❌ [admin/toggle-schedule] Dashboard token not configured"
      );
      return NextResponse.json(
        { success: false, error: "Dashboard token not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { status, location_id } = body;

    console.log("📨 [admin/toggle-schedule] Parsed body", {
      rawBody: body,
      status,
      location_id,
      statusType: typeof status,
    });

    if (status === undefined || !location_id) {
      console.error(
        "❌ [admin/toggle-schedule] Missing required fields in body",
        {
          status,
          location_id,
        }
      );
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: status and location_id",
        },
        { status: 400 }
      );
    }

    const targetUrl = `${process.env.NEXT_PUBLIC_API_URL}/admin/helloworld/toggle-all-schedules`;
    console.log("➡️ [admin/toggle-schedule] Calling external API", {
      targetUrl,
      status,
      location_id,
    });

    const response = await fetch(targetUrl, {
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
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [admin/toggle-schedule] API request failed", {
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

    console.log("✅ [admin/toggle-schedule] Successfully toggled schedule", {
      targetUrl,
      hasData: !!data,
      keys: data ? Object.keys(data) : [],
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("❌ [admin/toggle-schedule] Error toggling schedule:", error);
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
