import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const locationId = searchParams.get("location_id");

    if (!locationId) {
      return NextResponse.json(
        {
          success: false,
          message: "location_id parameter is required",
        },
        { status: 400 }
      );
    }

    // Forward request to the external API
    const apiUrl = `https://multitake.bettersolution.gr/api/locations/${locationId}/menu-categories`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Add cache control for better performance
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching menu categories:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch menu categories",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
