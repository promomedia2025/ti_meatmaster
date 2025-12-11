import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  console.log("🔍 [search-tags] Request received");
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/search-tags`;
    console.log("🔍 [search-tags] External API URL:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Add cache control for better performance
      cache: "no-store",
    });

    console.log(
      "🔍 [search-tags] External API response status:",
      response.status
    );
    console.log("🔍 [search-tags] External API response ok:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [search-tags] API request failed:", response.status);
      console.error("❌ [search-tags] Error response:", errorText);
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log(
      "✅ [search-tags] External API response data type:",
      typeof data
    );
    console.log(
      "✅ [search-tags] External API response keys:",
      Object.keys(data || {})
    );
    console.log(
      "✅ [search-tags] Full response data:",
      JSON.stringify(data, null, 2)
    );

    if (Array.isArray(data)) {
      console.log(
        "✅ [search-tags] Response is array with length:",
        data.length
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ [search-tags] Error fetching search tags:", error);
    if (error instanceof Error) {
      console.error("❌ [search-tags] Error message:", error.message);
      console.error("❌ [search-tags] Error stack:", error.stack);
    }
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch search tags",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
