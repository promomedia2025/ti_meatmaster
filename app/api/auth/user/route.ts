import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Forward cookies from the client request
    const cookieHeader = request.headers.get("cookie") || "";

    // Make the GET request to the external API to verify session and get user
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/user`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
      }
    );

    let result;
    try {
      const responseText = await response.text();
      if (!responseText) {
        throw new Error("Empty response from server");
      }
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Error parsing response:", parseError);
      return NextResponse.json(
        {
          success: false,
          error: `Server returned invalid response: ${response.status}`,
        },
        { status: 500 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            result.message ||
            result.error ||
            `API request failed with status: ${response.status}`,
        },
        { status: response.status }
      );
    }

    // Forward cookies from backend to client
    const setCookieHeader = response.headers.get("set-cookie");
    const response_data = NextResponse.json({
      success: true,
      data: result.data || result,
    });

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
      response_data.headers.set("set-cookie", modifiedCookies);
    }

    return response_data;
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, first_name, last_name, email, telephone } = body;

    // Validate required fields
    if (!user_id || !first_name || !last_name || !email || !telephone) {
      return NextResponse.json(
        {
          success: false,
          error:
            "All fields are required: user_id, first_name, last_name, email, telephone",
        },
        { status: 400 }
      );
    }

    // Get CSRF token first
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

    if (!csrfResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to get CSRF token: ${csrfResponse.status}`,
        },
        { status: 500 }
      );
    }

    let csrfData;
    try {
      csrfData = await csrfResponse.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Failed to parse CSRF token response" },
        { status: 500 }
      );
    }

    const csrfToken = csrfData.csrfToken || csrfData.csrf_token;

    if (!csrfToken) {
      return NextResponse.json(
        { success: false, error: "Invalid CSRF token response" },
        { status: 500 }
      );
    }

    // Forward cookies from the client request
    const cookieHeader = request.headers.get("cookie") || "";

    // Make the PUT request to the external API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/user`,
      {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": csrfToken,
          Cookie: cookieHeader,
        },
        body: JSON.stringify({
          user_id,
          first_name,
          last_name,
          email,
          telephone,
        }),
      }
    );

    let result;
    try {
      const responseText = await response.text();
      if (!responseText) {
        throw new Error("Empty response from server");
      }
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Error parsing response:", parseError);
      return NextResponse.json(
        {
          success: false,
          error: `Server returned invalid response: ${response.status}`,
        },
        { status: 500 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            result.message ||
            result.error ||
            `API request failed with status: ${response.status}`,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data || result,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, require_password } = body;

    // Validate password is provided if required
    if (require_password && !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Password is required to delete account",
        },
        { status: 400 }
      );
    }

    // Get CSRF token first
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

    if (!csrfResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to get CSRF token: ${csrfResponse.status}`,
        },
        { status: 500 }
      );
    }

    let csrfData;
    try {
      csrfData = await csrfResponse.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Failed to parse CSRF token response" },
        { status: 500 }
      );
    }

    const csrfToken = csrfData.csrfToken || csrfData.csrf_token;

    if (!csrfToken) {
      return NextResponse.json(
        { success: false, error: "Invalid CSRF token response" },
        { status: 500 }
      );
    }

    // Forward cookies from the client request
    const cookieHeader = request.headers.get("cookie") || "";

    // Make the DELETE request to the external API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/user`,
      {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": csrfToken,
          Cookie: cookieHeader,
        },
        body: JSON.stringify({
          password,
          require_password,
        }),
      }
    );

    let result;
    try {
      const responseText = await response.text();
      if (!responseText) {
        throw new Error("Empty response from server");
      }
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Error parsing response:", parseError);
      return NextResponse.json(
        {
          success: false,
          error: `Server returned invalid response: ${response.status}`,
        },
        { status: 500 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            result.message ||
            result.error ||
            `API request failed with status: ${response.status}`,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data || result,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}