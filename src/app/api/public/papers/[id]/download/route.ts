import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import path from "path";
import fs from "fs";
import { logSecurityEvent, EventTypes } from "@/lib/security";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ip = req.headers.get("x-forwarded-for") || "unknown";

    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
    }

    const [rows]: any = await db.query(
      "SELECT file_path, original_filename FROM papers WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: "Paper not found" }, { status: 404 });
    }

    const paper = rows[0];
    const filePath = path.resolve(/*turbopackIgnore: true*/ process.cwd(), paper.file_path);
    const uploadsRoot = path.resolve(/*turbopackIgnore: true*/ process.cwd(), "uploads");

    console.log(`Download attempt: ${filePath}`);
    console.log(`Uploads root: ${uploadsRoot}`);

    // Path traversal protection
    if (!filePath.startsWith(uploadsRoot)) {
      console.error(`Path traversal blocked: ${filePath} (not in ${uploadsRoot})`);
      logSecurityEvent(EventTypes.PATH_TRAVERSAL_ATTEMPT, {
        path: req.nextUrl.pathname,
        ip,
        filePath
      });
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }

    if (!fs.existsSync(filePath)) {
      console.error(`File missing on disk: ${filePath}`);
      return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
    }

    // Increment download count
    await db.query("UPDATE papers SET download_count = download_count + 1 WHERE id = ?", [id]);

    const fileBuffer = fs.readFileSync(filePath);
    const contentType = paper.file_path.toLowerCase().endsWith(".pdf") 
      ? "application/pdf" 
      : "application/octet-stream";
    
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Disposition": `attachment; filename="${paper.original_filename}"`,
        "Content-Type": contentType,
      },
    });

  } catch (error) {
    console.error("Download API Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
