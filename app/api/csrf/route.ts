import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function GET() {
  try {
    // Generate a random CSRF token
    const csrfToken = randomBytes(32).toString("hex");
    
    // In a real application, you might want to:
    // 1. Store this token in a session or database
    // 2. Set it as a cookie
    // 3. Validate it on subsequent requests
    
    return NextResponse.json({ csrfToken });
  } catch (error) {
    console.error("Error generating CSRF token:", error);
    return NextResponse.json(
      { error: "Failed to generate CSRF token" },
      { status: 500 }
    );
  }
}


