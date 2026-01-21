import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  console.log("📥 [UPDATE-DELIVERY-TIME] API route called");

  try {
    const body = await request.json();
    console.log("📥 [UPDATE-DELIVERY-TIME] Request body received:", {
      order_id: body.order_id,
      estimated_delivery_time: body.estimated_delivery_time,
      hasOrderId: !!body.order_id,
      hasEstimatedTime: body.estimated_delivery_time !== undefined,
    });

    const { order_id, estimated_delivery_time } = body;

    if (!order_id || estimated_delivery_time === undefined) {
      console.error("❌ [UPDATE-DELIVERY-TIME] Missing required fields:", {
        order_id: !!order_id,
        estimated_delivery_time: estimated_delivery_time !== undefined,
      });
      return NextResponse.json(
        {
          success: false,
          error: "order_id and estimated_delivery_time are required",
        },
        { status: 400 }
      );
    }

    // Call backend API to update delivery time (server will broadcast .orderEstimatedTime event)
    const externalApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/admin/orders/updateEstimatedTime`;
    const requestBody = {
      order_id,
      estimated_minutes: estimated_delivery_time, // Backend expects estimated_minutes
    };

    console.log("🌐 [UPDATE-DELIVERY-TIME] Calling external API:", externalApiUrl);
    console.log(
      "🌐 [UPDATE-DELIVERY-TIME] Request body being sent:",
      JSON.stringify(requestBody, null, 2)
    );

    const fetchStartTime = Date.now();
    const response = await fetch(externalApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      credentials: "include",
    });

    const fetchDuration = Date.now() - fetchStartTime;
    console.log("🌐 [UPDATE-DELIVERY-TIME] External API response received:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      duration: `${fetchDuration}ms`,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [UPDATE-DELIVERY-TIME] External API request failed:", {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 500),
        fullErrorText: errorText,
      });
      return NextResponse.json(
        {
          success: false,
          error: `API request failed with status: ${response.status}`,
          details: errorText.substring(0, 200),
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log("✅ [UPDATE-DELIVERY-TIME] External API success response:", {
      success: result.success,
      data: result.data,
      message: result.message,
      fullResponse: JSON.stringify(result, null, 2),
    });

    // Note: The server will automatically broadcast the .orderEstimatedTime event
    // to the order.[orderId] channel, so we don't need to broadcast here

    return NextResponse.json({
      success: true,
      data: {
        order_id,
        estimated_delivery_time,
      },
    });
  } catch (error) {
    console.error("❌ [UPDATE-DELIVERY-TIME] Error caught:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
