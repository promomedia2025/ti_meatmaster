import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { locationId: string } }
) {
  try {
    const locationId = params.locationId;
    const body = await request.json();
    const { latitude, longitude } = body;

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

    // Call external API with POST and coordinates in body
    const requestBody = {
      latitude: latitude.toString(),
      longitude: longitude.toString(),
    };

    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/customer-api/locations/${locationId}/delivery-availability`;

    console.log("📤 [DELIVERY-AVAILABILITY] Calling external API:", {
      url: apiUrl,
      method: "POST",
      body: requestBody,
    });

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      cache: "no-store",
    });

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

    console.log("📦 [DELIVERY-AVAILABILITY] API Response:", {
      status: response.status,
      locationId,
      requestBody: { latitude, longitude },
      responseData: data,
      fullResponse: JSON.stringify(data, null, 2),
    });

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
