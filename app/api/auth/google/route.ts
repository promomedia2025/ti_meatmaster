import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * API Route: Initiate Google OAuth Flow
 * 
 * This endpoint redirects the user to Google's OAuth consent screen
 */
export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.GOOGLE_AUTH_CLIENT_ID;
    
    if (!clientId) {
      return NextResponse.json(
        { success: false, error: "Google OAuth not configured" },
        { status: 500 }
      );
    }

    // Get the origin URL for the callback
    const origin = request.nextUrl.origin;
    const redirectUri = `${origin}/api/auth/google/callback`;
    
    // Generate state parameter for CSRF protection
    const state = crypto.randomUUID();
    
    // Store state in a cookie (you might want to use a session store instead)
    const response = NextResponse.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent("openid email profile")}&` +
      `state=${encodeURIComponent(state)}&` +
      `access_type=offline&` +
      `prompt=consent`
    );
    
    // Store state in httpOnly cookie for verification
    response.cookies.set("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
    });

    return response;
  } catch (error) {
    console.error("Error initiating Google OAuth:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
