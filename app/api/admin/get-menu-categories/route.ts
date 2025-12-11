import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Get cookies from the request to forward to external API
    const cookies = request.headers.get("cookie") || "";

    // Make request to the external API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/helloworld/get-menu-categories`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookies,
        },
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

    // Handle different response formats
    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("❌ Error fetching menu categories:", error);
    if (error instanceof Error) {
      console.error("❌ Error message:", error.message);
      console.error("❌ Error stack:", error.stack);
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch menu categories" },
      { status: 500 }
    );
  }
}
