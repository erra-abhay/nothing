import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

async function isAdmin(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return false;
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    return decoded.role === "admin";
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  
  try {
    const logsDir = path.join(process.cwd(), "logs");
    if (!fs.existsSync(logsDir)) {
      return NextResponse.json({ success: true, data: [] });
    }

    const files = fs.readdirSync(logsDir)
      .filter(f => f.startsWith("security-") && f.endsWith(".log"))
      .sort()
      .reverse();

    if (files.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Read the most recent 2 log files
    let allEvents: any[] = [];
    for (const file of files.slice(0, 2)) {
      const content = fs.readFileSync(path.join(logsDir, file), "utf8");
      const events = content.split("\n")
        .filter(line => line.trim())
        .map(line => JSON.parse(line));
      allEvents = [...allEvents, ...events];
    }

    // Sort by timestamp descending and limit to 50
    const sortedEvents = allEvents
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50);

    return NextResponse.json({ success: true, data: sortedEvents });
  } catch (error) {
    console.error("Fetch Events Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
