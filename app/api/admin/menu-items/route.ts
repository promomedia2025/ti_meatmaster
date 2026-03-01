import { NextRequest, NextResponse } from "next/server";

// Remove force-dynamic to allow caching
// export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    // Get cookies from the request
    const cookieHeader = request.headers.get("cookie") || "";

    console.log("🔍 [CACHE] [GET /api/admin/menu-items] Request received at:", new Date().toISOString());

    // Forward the request to the external API with credentials
    // Use Next.js fetch caching with a tag so we can invalidate when menu items change
    // Note: Cache is based on URL only, not headers/cookies, so all users get the same cached data
    const fetchStartTime = Date.now();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/helloworld/get-menu-items`,
      {
        method: "GET",
        headers: {
          Cookie: cookieHeader,
        },
        credentials: "include",
        // Enable data cache with a tag for invalidation on toggle
        // Cache key is based on URL only, so cookies don't affect cache hits
        next: { 
          tags: ["admin-menu-items"],
          revalidate: false, // Only invalidate via revalidateTag
        },
      }
    );
    const fetchDuration = Date.now() - fetchStartTime;

    // If fetch was very fast (< 50ms), it's likely from cache
    const likelyCacheHit = fetchDuration < 50;
    console.log(`📦 [CACHE] Fetch duration: ${fetchDuration}ms ${likelyCacheHit ? "✅ (likely CACHE HIT)" : "🔄 (likely FRESH FETCH)"}`);
    console.log("🔍 [Server] External API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [Server] External API error:", errorText);
      return NextResponse.json(
        { success: false, error: "Failed to fetch menu items" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const totalDuration = Date.now() - startTime;
    console.log(`✅ [CACHE] [GET /api/admin/menu-items] Total duration: ${totalDuration}ms`);
    console.log("✅ [Server] Menu items fetched successfully");

    // Return the data with cache status header
    return NextResponse.json(data, {
      headers: {
        "X-Cache-Status": likelyCacheHit ? "HIT" : "MISS",
        "X-Fetch-Duration": `${fetchDuration}ms`,
        "X-Total-Duration": `${totalDuration}ms`,
      },
    });
  } catch (error) {
    console.error("❌ [Server] Error fetching menu items:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
