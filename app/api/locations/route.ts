import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Forward search parameters to the external API
    const queryString = searchParams.toString();
    const apiUrl = `https://multitake.bettersolution.gr/api/locations${
      queryString ? `?${queryString}` : ""
    }`;

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
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch locations",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
