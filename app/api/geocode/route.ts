import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get("address");
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");
    const language = searchParams.get("lang") || "el"; // Default to Greek

    // Reverse geocoding (coordinates to address)
    if (lat && lon) {
      if (!GOOGLE_API_KEY || GOOGLE_API_KEY === "your_google_api_key_here") {
        return NextResponse.json(
          {
            success: false,
            message: "Google Maps API key is not configured",
          },
          { status: 500 }
        );
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${GOOGLE_API_KEY}&language=${language}`
      );

      if (!response.ok) {
        return NextResponse.json(
          {
            success: false,
            message: "Failed to reverse geocode",
          },
          { status: response.status }
        );
      }

      const data = await response.json();
      if (data.status === "OK" && data.results.length > 0) {
        const result = data.results[0];
        // Convert Google format to our format
        const addressComponents = result.address_components;
        const formattedResult = {
          display_name: result.formatted_address,
          address: {
            road: addressComponents.find((c: any) => c.types.includes("route"))
              ?.long_name,
            house_number: addressComponents.find((c: any) =>
              c.types.includes("street_number")
            )?.long_name,
            suburb: addressComponents.find((c: any) =>
              c.types.includes("sublocality")
            )?.long_name,
            neighbourhood: addressComponents.find((c: any) =>
              c.types.includes("neighborhood")
            )?.long_name,
            city: addressComponents.find((c: any) =>
              c.types.includes("locality")
            )?.long_name,
            town: addressComponents.find((c: any) =>
              c.types.includes("administrative_area_level_3")
            )?.long_name,
            village: addressComponents.find((c: any) =>
              c.types.includes("administrative_area_level_4")
            )?.long_name,
            postcode: addressComponents.find((c: any) =>
              c.types.includes("postal_code")
            )?.long_name,
            country: addressComponents.find((c: any) =>
              c.types.includes("country")
            )?.long_name,
          },
        };
        return NextResponse.json({
          success: true,
          data: formattedResult,
        });
      }

      return NextResponse.json(
        {
          success: false,
          message: "No results found for the given coordinates",
        },
        { status: 404 }
      );
    }

    // Forward geocoding (address to coordinates)
    if (address) {
      if (!GOOGLE_API_KEY || GOOGLE_API_KEY === "your_google_api_key_here") {
        return NextResponse.json(
          {
            success: false,
            message: "Google Maps API key is not configured",
          },
          { status: 500 }
        );
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address
        )}&components=country:GR&key=${GOOGLE_API_KEY}&language=${language}`
      );

      if (!response.ok) {
        return NextResponse.json(
          {
            success: false,
            message: "Failed to geocode address",
          },
          { status: response.status }
        );
      }

      const data = await response.json();
      if (data.status === "OK" && data.results.length > 0) {
        // Convert Google results to Nominatim-like format
        const results = data.results.map((result: any) => {
          const addressComponents = result.address_components;
          return {
            lat: result.geometry.location.lat.toString(),
            lon: result.geometry.location.lng.toString(),
            display_name: result.formatted_address,
            address: {
              road: addressComponents.find((c: any) =>
                c.types.includes("route")
              )?.long_name,
              house_number: addressComponents.find((c: any) =>
                c.types.includes("street_number")
              )?.long_name,
              suburb: addressComponents.find((c: any) =>
                c.types.includes("sublocality")
              )?.long_name,
              neighbourhood: addressComponents.find((c: any) =>
                c.types.includes("neighborhood")
              )?.long_name,
              city: addressComponents.find((c: any) =>
                c.types.includes("locality")
              )?.long_name,
              town: addressComponents.find((c: any) =>
                c.types.includes("administrative_area_level_3")
              )?.long_name,
              village: addressComponents.find((c: any) =>
                c.types.includes("administrative_area_level_4")
              )?.long_name,
              postcode: addressComponents.find((c: any) =>
                c.types.includes("postal_code")
              )?.long_name,
              country: addressComponents.find((c: any) =>
                c.types.includes("country")
              )?.long_name,
            },
          };
        });

        return NextResponse.json({
          success: true,
          data: results,
        });
      }

      return NextResponse.json(
        {
          success: false,
          message: "No results found for the given address",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Missing required parameters. Provide either 'address' or 'lat' and 'lon'",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in geocode API:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
