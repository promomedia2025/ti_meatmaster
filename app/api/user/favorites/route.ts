import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();

    // Build cookie header string from all cookies
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    console.log("❤️ [FAVORITES API] Fetching user favorites");
    console.log(
      "❤️ [FAVORITES API] Cookies available:",
      cookieHeader ? "Yes" : "No"
    );
    console.log(
      "❤️ [FAVORITES API] Cookie header length:",
      cookieHeader.length
    );

    if (!cookieHeader) {
      console.warn("❤️ [FAVORITES API] ⚠️ No cookies found for authentication");
    }

    // Get user favorites from API
    const response = await fetch(
      "https://multitake.bettersolution.gr/public/locations/favorites",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(cookieHeader && { Cookie: cookieHeader }),
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch favorites: ${response.status}`,
          message: errorText,
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
