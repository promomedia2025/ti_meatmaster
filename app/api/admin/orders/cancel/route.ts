import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  console.log("📥 [CANCEL-ORDER] API route called");

  try {
    const body = await request.json();
    console.log("📥 [CANCEL-ORDER] Request body received:", {
      order_id: body.order_id,
      hasOrderId: !!body.order_id,
    });

    const { order_id } = body;

    if (!order_id) {
      console.error("❌ [CANCEL-ORDER] Missing required field: order_id");
      return NextResponse.json(
        {
          success: false,
          error: "order_id is required",
        },
        { status: 400 }
      );
    }

    // Make the request to the external API server-side (avoids CORS)
    const externalApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/admin/orders/cancelOrder/${order_id}`;

    console.log("🌐 [CANCEL-ORDER] Calling external API:", externalApiUrl);

    const fetchStartTime = Date.now();
    const response = await fetch(externalApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const fetchDuration = Date.now() - fetchStartTime;
    console.log("🌐 [CANCEL-ORDER] External API response received:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      duration: `${fetchDuration}ms`,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [CANCEL-ORDER] External API request failed:", {
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

    const result = await response.json().catch(() => {
      // If response is not JSON, return success anyway
      return { success: true };
    });

    console.log("✅ [CANCEL-ORDER] External API success response:", {
      success: result.success,
      data: result.data,
      message: result.message,
      fullResponse: JSON.stringify(result, null, 2),
    });

    console.log("✅ [CANCEL-ORDER] Returning success response to client");
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ [CANCEL-ORDER] Error caught:", {
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
