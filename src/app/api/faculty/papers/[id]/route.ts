import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { logSecurityEvent, EventTypes } from "@/lib/security";

async function getAuth(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as any;
  } catch {
    return null;
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuth(req);
    const ip = req.headers.get("x-forwarded-for") || "unknown";

    if (!user || user.role !== "faculty") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { subject_id, semester, paper_type, year } = await req.json();

    // Verify paper belongs to faculty
    const [papers]: any = await db.query(
      "SELECT * FROM papers WHERE id = ? AND uploaded_by = ?",
      [id, user.id]
    );

    if (papers.length === 0) {
      return NextResponse.json({ success: false, error: "Paper not found or access denied" }, { status: 404 });
    }

    const updates = [];
    const dbParams = [];

    if (subject_id) {
      updates.push("subject_id = ?");
      dbParams.push(subject_id);
    }
    if (semester) {
      updates.push("semester = ?");
      dbParams.push(semester);
    }
    if (paper_type) {
      updates.push("paper_type = ?");
      dbParams.push(paper_type);
    }
    if (year) {
      updates.push("year = ?");
      dbParams.push(year);
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 });
    }

    dbParams.push(id);

    await db.query(
      `UPDATE papers SET ${updates.join(", ")} WHERE id = ?`,
      dbParams
    );

    logSecurityEvent(EventTypes.DATA_MODIFICATION, {
      table: "papers",
      paperId: id,
      userId: user.id,
      ip,
      changes: updates
    });

    return NextResponse.json({ success: true, message: "Paper updated successfully" });
  } catch (error) {
    console.error("Update Paper Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuth(req);
    const ip = req.headers.get("x-forwarded-for") || "unknown";

    if (!user || user.role !== "faculty") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get paper details
    const [papers]: any = await db.query(
      "SELECT file_path FROM papers WHERE id = ? AND uploaded_by = ?",
      [id, user.id]
    );

    if (papers.length === 0) {
      return NextResponse.json({ success: false, error: "Paper not found or access denied" }, { status: 404 });
    }

    const filePath = path.resolve(process.cwd(), papers[0].file_path);
    const uploadsRoot = path.resolve(process.cwd(), "uploads");

    // Path traversal protection
    if (!filePath.startsWith(uploadsRoot)) {
      logSecurityEvent(EventTypes.PATH_TRAVERSAL_ATTEMPT, {
        path: req.nextUrl.pathname,
        ip,
        filePath
      });
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }

    // Delete from database
    await db.query("DELETE FROM papers WHERE id = ?", [id]);

    // Delete file from filesystem
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    logSecurityEvent(EventTypes.DATA_DELETION, {
      table: "papers",
      paperId: id,
      userId: user.id,
      ip,
      filename: papers[0].file_path
    });

    return NextResponse.json({ success: true, message: "Paper deleted successfully" });
  } catch (error) {
    console.error("Delete Paper Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
