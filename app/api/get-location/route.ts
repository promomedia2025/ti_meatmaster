import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get the user's IP from the request headers
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ip = forwarded?.split(",")[0] || realIp || "unknown";

    console.log("📍 Server detected IP:", ip);

    // In development (localhost), use a public IP for testing
    // In production, this will be the actual user's IP

    // Call the IP geolocation API from the server side
    const geoUrl = `https://ipapi.co/${ip}/json/`;

    const response = await fetch(geoUrl);

    if (response.ok) {
      const data = await response.json();
      console.log("📍 Location data:", data);

      return NextResponse.json({
        success: true,
        city: data.city || "Unknown",
        country: data.country_name || "Unknown",
        region: data.region || "Unknown",
        ip: data.ip,
      });
    } else {
      // Fallback: return a default location
      return NextResponse.json({
        success: false,
        city: "Athens", // Default fallback city
        country: "Greece",
        region: "Attica",
        ip: ip,
      });
    }
  } catch (error) {
    console.error("Error getting location:", error);

    // Return fallback location on error
    return NextResponse.json({
      success: false,
      city: "Athens", // Default fallback city
      country: "Greece",
      region: "Attica",
    });
  }
}


