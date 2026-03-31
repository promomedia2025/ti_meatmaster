import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Get cookies from the request
    const cookies = request.headers.get("cookie") || "";
    
    console.log("🔍 Admin check - Cookies received:", cookies);

    if (!cookies) {
      console.log("⚠️ Admin check - No cookies found");
      return NextResponse.json(
        { success: false, authenticated: false, error: "No session found" },
        { status: 401 }
      );
    }

    // Check if meat_master_session cookie exists
    const hasSessionCookie = cookies
      .toLowerCase()
      .includes("meat_master_session=");
    
    console.log("🔍 Admin check - Has meat_master_session:", hasSessionCookie);

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
