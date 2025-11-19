import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { socket_id, channel_name } = await request.json();

    // For private channels, you might want to authenticate the user
    // This is a basic implementation - you can enhance it based on your needs

    // Get user from session/token (implement based on your auth system)
    // const user = await getCurrentUser(request);

    // For now, we'll allow all authenticated users
    // In production, you should validate the user's permissions

    const authResponse = {
      auth: `${process.env.PUSHER_KEY}:${generateAuthSignature(
        socket_id,
        channel_name
      )}`,
    };

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error("Pusher auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 403 }
    );
  }
}

// Generate auth signature for private channels
function generateAuthSignature(socketId: string, channelName: string): string {
  // This is a simplified version - in production, use proper HMAC signing
  const crypto = require("crypto");
  const secret = process.env.PUSHER_SECRET || "";
  const stringToSign = `${socketId}:${channelName}`;

  return crypto.createHmac("sha256", secret).update(stringToSign).digest("hex");
}
