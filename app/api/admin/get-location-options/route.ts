import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json().catch(() => ({}));
    const { location_id } = requestBody;


    if (!location_id) {
      return NextResponse.json(
        {
          success: false,
          error: "location_id is required",
        },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/helloworld/get-location-options`,
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
      return NextResponse.json(
        {
          success: false,
          error: `Invalid response from API: ${response.status}`,
        },
        { status: response.status }
      );
    }

    // Handle API response structure
    if (!data.success) {
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
    return NextResponse.json(
      { success: false, error: "Failed to fetch location options" },
      { status: 500 }
    );
  }
}
