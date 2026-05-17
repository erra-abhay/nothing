import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const sessionId = searchParams.get("sessionId");

  if (!userId || !sessionId) {
    return NextResponse.json({ active: false }, { status: 400 });
  }

  try {
    const activeSessionId = await redis.get(`user_session:${userId}`);
    
    if (activeSessionId === sessionId) {
      return NextResponse.json({ active: true }, { status: 200 });
    }
    
    return NextResponse.json({ active: false }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ active: false }, { status: 500 });
  }
}
