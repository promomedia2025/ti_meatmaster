import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const response = await fetch(
      "https://cocofino.bettersolution.gr/admin/helloworld/get-location-options",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location_id: 13,
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
      data: data.options || {},
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch location options" },
      { status: 500 }
    );
  }
}
