import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  console.log("📥 [UPDATE-STATUS] API route called");
  console.log("📥 [UPDATE-STATUS] Request method:", request.method);
  console.log("📥 [UPDATE-STATUS] Request URL:", request.url);

  try {
    const body = await request.json();
    console.log("📥 [UPDATE-STATUS] Request body received:", {
      order_id: body.order_id,
      status_id: body.status_id,
      hasOrderId: !!body.order_id,
      hasStatusId: !!body.status_id,
    });

    const { order_id, status_id } = body;

    if (!order_id || !status_id) {
      console.error("❌ [UPDATE-STATUS] Missing required fields:", {
        order_id: !!order_id,
        status_id: !!status_id,
      });
      return NextResponse.json(
        {
          success: false,
          error: "order_id and status_id are required",
        },
        { status: 400 }
      );
    }

    // Make the request to the external API server-side (avoids CORS)
    const externalApiUrl =
      "https://cocofino.bettersolution.gr/admin/orders/updateOrderStatus";
    const requestBody = {
      order_id,
      status_id,
    };

    console.log("🌐 [UPDATE-STATUS] Calling external API:", externalApiUrl);
    console.log(
      "🌐 [UPDATE-STATUS] Request body being sent:",
      JSON.stringify(requestBody, null, 2)
    );
    console.log("🌐 [UPDATE-STATUS] Request body (raw):", requestBody);

    const fetchStartTime = Date.now();
    const response = await fetch(externalApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const fetchDuration = Date.now() - fetchStartTime;
    console.log("🌐 [UPDATE-STATUS] External API response received:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      duration: `${fetchDuration}ms`,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [UPDATE-STATUS] External API request failed:", {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 500), // Limit log size
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
    console.log("✅ [UPDATE-STATUS] External API success response:", {
      success: result.success,
      data: result.data,
      message: result.message,
      fullResponse: JSON.stringify(result, null, 2),
    });

    console.log("✅ [UPDATE-STATUS] Returning success response to client");
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ [UPDATE-STATUS] Error caught:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : typeof error,
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
