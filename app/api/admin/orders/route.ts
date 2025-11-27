import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const dashboardToken = process.env.DASHBOARD_TOKEN;

    if (!dashboardToken) {
      return NextResponse.json(
        { success: false, error: "Dashboard token not configured" },
        { status: 500 }
      );
    }

    // Make request to the external API
    const response = await fetch(
      "https://cocofino.bettersolution.gr/api/orders?sort=order_id desc&pageLimit=100",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${dashboardToken}`,
        },
        cache: "no-store",
      }
    );

    console.log("🔍 Admin Orders API - Request started");
    console.log("🔍 Dashboard token exists:", !!dashboardToken);
    console.log("🔍 Dashboard token length:", dashboardToken?.length);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API request failed:", response.status, errorText);
      return NextResponse.json(
        {
          success: false,
          error: `API request failed with status: ${response.status}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("✅ External API response status:", response.status);
    console.log("✅ External API response data type:", typeof data);
    console.log("✅ External API response keys:", Object.keys(data || {}));

    // Transform the response structure
    // The API returns data in format: { data: [{ type, id, attributes: {...} }] }
    // We need to extract the attributes and map them to our Order interface
    const transformedOrders = Array.isArray(data.data)
      ? data.data.map((item: any) => {
          const attrs = item.attributes || {};
          return {
            order_id: attrs.order_id,
            order_date: attrs.order_date || attrs.created_at,
            order_time: attrs.order_time,
            order_total: attrs.order_total?.toString() || "0",
            currency: attrs.currency || "EUR",
            status_id: attrs.status_id,
            created_at: attrs.created_at,
            location_name:
              attrs.formatted_address ||
              `Location ${attrs.location_id}` ||
              "Unknown",
            status_name:
              attrs.status_name || attrs.status?.status_name || "Unknown",
            // Include full order details for the modal
            order_menus: attrs.order_menus || [],
            order_totals: attrs.order_totals || [],
            customer_name: attrs.customer_name,
            customer_id: attrs.customer_id,
            telephone: attrs.telephone,
            email: attrs.email,
            payment: attrs.payment,
            order_type: attrs.order_type,
            order_type_name: attrs.order_type_name,
            comment: attrs.comment,
            total_items: attrs.total_items,
          };
        })
      : [];

    console.log("✅ Transformed orders count:", transformedOrders.length);
    console.log(
      "✅ First order sample:",
      transformedOrders[0]
        ? JSON.stringify(transformedOrders[0], null, 2)
        : "none"
    );

    // Return consistent structure
    const responseData = {
      success: true,
      data: transformedOrders,
      ...(data.meta?.pagination && { pagination: data.meta.pagination }),
    };

    console.log("✅ Returning response with success:", responseData.success);
    console.log("✅ Response data length:", transformedOrders.length);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("❌ Error fetching admin orders:", error);
    if (error instanceof Error) {
      console.error("❌ Error message:", error.message);
      console.error("❌ Error stack:", error.stack);
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
