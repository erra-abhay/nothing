import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyActiveSession, SessionData } from "@/lib/auth";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const session = await verifyActiveSession(token);

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    // Get fresh user data to ensure name is up to date
    const [users]: any = await db.query("SELECT name FROM users WHERE id = ?", [session.id]);
    
    return NextResponse.json({
      success: true,
      user: {
        id: session.id,
        name: users.length > 0 ? users[0].name : session.email,
        email: session.email,
        role: session.role,
        department_id: session.department_id
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
  }
}
