import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * API Route: Google OAuth Callback
 * 
 * This endpoint handles the callback from Google OAuth
 * Exchanges the authorization code for tokens and creates/logs in the user
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Check for OAuth errors
    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(
        `${request.nextUrl.origin}/?error=${encodeURIComponent(error)}`
      );
    }

    // Verify state parameter
    const storedState = request.cookies.get("oauth_state")?.value;
    if (!state || state !== storedState) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/?error=${encodeURIComponent("Invalid state parameter")}`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/?error=${encodeURIComponent("No authorization code received")}`
      );
    }

    const clientId = process.env.GOOGLE_AUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_AUTH_CLIENT_SECRET;
    const redirectUri = `${request.nextUrl.origin}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/?error=${encodeURIComponent("Google OAuth not configured")}`
      );
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange error:", errorData);
      return NextResponse.redirect(
        `${request.nextUrl.origin}/?error=${encodeURIComponent("Failed to exchange token")}`
      );
    }

    const tokens = await tokenResponse.json();
    const { access_token, id_token } = tokens;

    // Get user info from Google
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/?error=${encodeURIComponent("Failed to fetch user info")}`
      );
    }

    const googleUser = await userInfoResponse.json();
    console.log("Google user info:", googleUser);

    // Get CSRF token for backend API
    const csrfResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/csrf`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: request.headers.get("cookie") || "",
        },
      }
    );

    let csrfToken = null;
    if (csrfResponse.ok) {
      const csrfData = await csrfResponse.json();
      csrfToken = csrfData.csrfToken || csrfData.csrf_token;
    }

    // Call your backend API to create/login user with Google OAuth
    // Adjust the endpoint based on your backend API structure
    const cookieHeader = request.headers.get("cookie") || "";
    
    const backendResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/login`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken && { "X-CSRF-TOKEN": csrfToken }),
          Cookie: cookieHeader,
        },
        body: JSON.stringify({
          google_id: googleUser.id,
          email: googleUser.email,
          name: googleUser.name,
          first_name: googleUser.given_name,
          last_name: googleUser.family_name,
          picture: googleUser.picture,
          access_token: access_token,
          id_token: id_token,
        }),
      }
    );

    let backendData;
    try {
      const responseText = await backendResponse.text();
      if (!responseText) {
        throw new Error("Empty response from server");
      }
      backendData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Error parsing backend response:", parseError);
      return NextResponse.redirect(
        `${request.nextUrl.origin}/?error=${encodeURIComponent("Invalid response from server")}`
      );
    }

    if (!backendResponse.ok) {
      console.error("Backend API error:", backendData);
      return NextResponse.redirect(
        `${request.nextUrl.origin}/?error=${encodeURIComponent(
          backendData?.error || backendData?.message || "Authentication failed"
        )}`
      );
    }

    // Extract user data from backend response (same structure as login response)
    const userData = backendData?.data?.data?.user || backendData?.data?.user || backendData?.user;
    
    console.log("🔍 [GOOGLE OAUTH] Backend response structure:", {
      hasData: !!backendData?.data,
      hasDataData: !!backendData?.data?.data,
      hasDataDataUser: !!backendData?.data?.data?.user,
      hasDataUser: !!backendData?.data?.user,
      hasUser: !!backendData?.user,
      extractedUser: userData,
    });
    
    // Remove id from user data before storing (we'll get it from session verification)
    let userDataWithoutId = {};
    if (userData) {
      const { id, ...rest } = userData;
      userDataWithoutId = rest;
      console.log("🔍 [GOOGLE OAUTH] User data without id:", userDataWithoutId);
    } else {
      console.error("❌ [GOOGLE OAUTH] No user data found in backend response!");
    }
    
    // Forward cookies from backend to client
    const setCookieHeader = backendResponse.headers.get("set-cookie");
    
    // Build redirect URL with user data if available (without id)
    let redirectUrl = `${request.nextUrl.origin}/?google_auth=success`;
    if (userDataWithoutId && Object.keys(userDataWithoutId).length > 0) {
      // Encode user data to pass it in the URL (temporary, will be stored in localStorage by client)
      const encodedUserData = encodeURIComponent(JSON.stringify(userDataWithoutId));
      redirectUrl += `&user_data=${encodedUserData}`;
      console.log("✅ [GOOGLE OAUTH] User data added to redirect URL");
    } else {
      console.error("❌ [GOOGLE OAUTH] User data without id is empty, not adding to URL");
    }
    
    const redirectResponse = NextResponse.redirect(redirectUrl);
    
    // Clear OAuth state cookie
    redirectResponse.cookies.delete("oauth_state");

    if (setCookieHeader) {
      // Parse and modify Laravel session cookies for localhost
      const cookies = setCookieHeader.split(",").map((cookie) => {
        return cookie
          .replace(/Domain=[^;]+/gi, "")
          .replace(/Secure/gi, "")
          .replace(/SameSite=[^;]+/gi, "SameSite=Lax")
          .trim();
      });

      const modifiedCookies = cookies.join(", ");
      redirectResponse.headers.set("set-cookie", modifiedCookies);
    }

    return redirectResponse;
  } catch (error) {
    console.error("Error in Google OAuth callback:", error);
    return NextResponse.redirect(
      `${request.nextUrl.origin}/?error=${encodeURIComponent(
        error instanceof Error ? error.message : "Unknown error occurred"
      )}`
    );
  }
}
