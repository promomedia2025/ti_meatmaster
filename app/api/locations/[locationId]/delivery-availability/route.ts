import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { locationId: string } }
) {
  try {
    const locationId = params.locationId;
    const { searchParams } = new URL(request.url);
    const latitude = searchParams.get("latitude");
    const longitude = searchParams.get("longitude");

    if (!locationId) {
      return NextResponse.json(
        {
          success: false,
          message: "Location ID is required",
          error: "LOCATION_ID_REQUIRED",
        },
        { status: 400 }
      );
    }

    if (!latitude || !longitude) {
      return NextResponse.json(
        {
          success: false,
          message: "Latitude and longitude are required",
          error: "COORDINATES_REQUIRED",
        },
        { status: 400 }
      );
    }

    // Call external API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/customer-api/locations/${locationId}/delivery-availability`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          message: errorData.message || "Failed to check delivery availability",
          error: "DELIVERY_AVAILABILITY_CHECK_FAILED",
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error checking delivery availability:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
