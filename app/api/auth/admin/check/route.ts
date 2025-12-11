import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Get cookies from the request
    const cookies = request.headers.get("cookie") || "";

    if (!cookies) {
      return NextResponse.json(
        { success: false, authenticated: false, error: "No session found" },
        { status: 401 }
      );
    }

    // Check if tastyigniter_session cookie exists
    const hasSessionCookie = cookies
      .toLowerCase()
      .includes("tastyigniter_session=");

    if (!hasSessionCookie) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          error: "No admin session token found",
        },
        { status: 401 }
      );
    }

    // Cookie exists - return authenticated
    return NextResponse.json({
      success: true,
      authenticated: true,
    });
  } catch (error) {
    console.error("Admin session check error:", error);
    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        error: "Failed to check session",
      },
      { status: 500 }
    );
  }
}
