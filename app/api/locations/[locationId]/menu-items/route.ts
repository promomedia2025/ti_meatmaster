import { NextRequest, NextResponse } from "next/server";

// Remove force-dynamic to allow caching
// export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { locationId: string } }
) {
  const startTime = Date.now();
  try {
    const { locationId } = params;
    const searchParams = request.nextUrl.searchParams;
    const categorySlug = searchParams.get("category_slug");
    const perPage = parseInt(searchParams.get("per_page") || "100", 10);

    console.log(`🔍 [CACHE] [GET /api/locations/${locationId}/menu-items] Request received at:`, new Date().toISOString());

    // Fetch all pages of menu items
    let page = 1;
    const allItems: any[] = [];
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;

    const fetchStartTime = Date.now();
    let totalFetchDuration = 0;

    while (true) {
      let apiUrl = `${baseUrl}/api/locations/${locationId}/menu-items?page=${page}&per_page=${perPage}`;

      if (categorySlug) {
        apiUrl += `&category_slug=${categorySlug}`;
      }

      // Use Next.js fetch caching with a tag so we can invalidate when menu items change
      const pageFetchStart = Date.now();
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Enable data cache with a tag for invalidation on toggle
        // Cache key is based on URL only
        next: { 
          tags: ["admin-menu-items"],
          revalidate: false, // Only invalidate via revalidateTag
        },
      });
      const pageFetchDuration = Date.now() - pageFetchStart;
      totalFetchDuration += pageFetchDuration;

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ [Server] External API error:", errorText);
        return NextResponse.json(
          { success: false, error: "Failed to fetch menu items" },
          { status: response.status }
        );
      }

      const data = await response.json();
      allItems.push(...data.data.menu_items);

      const { current_page, last_page } = data.data.pagination;
      if (current_page >= last_page) break;

      page++;
    }

    // If fetch was very fast (< 50ms per page on average), it's likely from cache
    const avgPageDuration = totalFetchDuration / page;
    const likelyCacheHit = avgPageDuration < 50;
    console.log(`📦 [CACHE] Total fetch duration: ${totalFetchDuration}ms (${page} pages, avg ${avgPageDuration.toFixed(1)}ms/page) ${likelyCacheHit ? "✅ (likely CACHE HIT)" : "🔄 (likely FRESH FETCH)"}`);

    const totalDuration = Date.now() - startTime;
    console.log(`✅ [CACHE] [GET /api/locations/${locationId}/menu-items] Total duration: ${totalDuration}ms, Items: ${allItems.length}`);

    // Return the data in the same format as before
    return NextResponse.json(
      {
        success: true,
        data: {
          menu_items: allItems,
        },
      },
      {
        headers: {
          "X-Cache-Status": likelyCacheHit ? "HIT" : "MISS",
          "X-Fetch-Duration": `${totalFetchDuration}ms`,
          "X-Total-Duration": `${totalDuration}ms`,
        },
      }
    );
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
