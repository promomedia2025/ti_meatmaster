import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = params.id;

    if (!customerId) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer ID is required",
          error: "Missing customer ID parameter",
        },
        { status: 400 }
      );
    }

    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/address-book/${customerId}`;
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store", // Don't cache - always fetch fresh data
    });

    if (!response.ok) {
      throw new Error(`External API responded with status: ${response.status}`);
    }

    const data = await response.json();
    // Coordinates are already in the response from external API, just pass through
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch address book",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify CSRF token from request headers
    const requestCsrfToken = request.headers.get("x-csrf-token");
    if (!requestCsrfToken) {
      return NextResponse.json(
        {
          success: false,
          message: "CSRF token is required",
          error: "Missing CSRF token in headers",
        },
        { status: 403 }
      );
    }


    const addressId = params.id;
    if (!addressId) {
      return NextResponse.json(
        {
          success: false,
          message: "Address ID is required",
          error: "Missing address ID parameter",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      customer_id,
      address_1,
      city,
      state,
      postcode,
      country,
      bell_name,
      floor,
      is_default,
      latitude,
      longitude,
    } = body;

    // Validation
    if (!customer_id) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer ID is required",
          error: "Missing customer_id in request body",
        },
        { status: 400 }
      );
    }

    if (!address_1 || !city || !postcode || !country) {
      return NextResponse.json(
        {
          success: false,
          message: "Required fields are missing",
          error: "address_1, city, postcode, and country are required",
        },
        { status: 400 }
      );
    }

    // Forward to external API
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/address-book/${addressId}`;

    const response = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer_id,
        address_1,
        city,
        state: state || "",
        postcode,
        country,
        bell_name: bell_name || "",
        floor: floor || "",
        is_default: is_default || false,
        ...(latitude !== undefined &&
          longitude !== undefined && {
            latitude,
            longitude,
          }),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`External API responded with status: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update address",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
