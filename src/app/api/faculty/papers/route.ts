import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import { initSearchIndex, indexPaper, invalidateCache } from "@/lib/redis";

import { logSecurityEvent, EventTypes } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    if (decoded.role !== "faculty" && decoded.role !== "admin") {
      logSecurityEvent(EventTypes.UNAUTHORIZED_ACCESS, {
        path: "/api/faculty/papers",
        method: "POST",
        userId: decoded.id,
        ip
      });
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const subjectId = formData.get("subject_id");
    const semester = formData.get("semester");
    const paperType = formData.get("paper_type");
    const year = formData.get("year");

    if (!file || !subjectId || !semester || !paperType || !year) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Verify file type
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "docx") {
      logSecurityEvent(EventTypes.FILE_UPLOAD_REJECTED, {
        userId: decoded.id,
        reason: "Invalid file type",
        filename: file.name,
        ip
      });
      return NextResponse.json({ success: false, error: "Only PDF and DOCX files are allowed" }, { status: 400 });
    }

    // Verify file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      logSecurityEvent(EventTypes.FILE_UPLOAD_REJECTED, {
        userId: decoded.id,
        reason: "File too large",
        size: file.size,
        filename: file.name,
        ip
      });
      return NextResponse.json({ success: false, error: "File too large" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const currentYear = new Date().getFullYear().toString();
    const uploadDir = path.join(process.cwd(), "uploads", "papers", currentYear);
    
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(uploadDir, fileName);
    const relativePath = path.join("uploads", "papers", currentYear, fileName);

    await writeFile(filePath, buffer);
    await initSearchIndex();

    const [result]: any = await db.query(
      `INSERT INTO papers (subject_id, department_id, semester, paper_type, year, file_path, original_filename, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [subjectId, decoded.department_id, semester, paperType, year, relativePath, file.name, decoded.id]
    );

    // Index for RediSearch
    const [newPaper]: any = await db.query(`
      SELECT p.id, p.semester, p.paper_type, p.year, s.name as subject_name, s.code as subject_code, d.name as department_name
      FROM papers p
      JOIN subjects s ON p.subject_id = s.id
      JOIN departments d ON p.department_id = d.id
      WHERE p.id = ?
    `, [result.insertId]);
    
    if (newPaper.length > 0) {
      await indexPaper(newPaper[0]);
    }

    await invalidateCache("public_stats");

    logSecurityEvent(EventTypes.FILE_UPLOAD, {
      user: decoded.name || decoded.email,
      userId: decoded.id,
      paperId: result.insertId,
      filename: file.name,
      ip
    });

    return NextResponse.json({ 
      success: true, 
      message: "Paper uploaded successfully",
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error("Upload API Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    const [rows]: any = await db.query(
      `SELECT p.*, s.name as subject_name, s.code as subject_code, d.name as department_name
       FROM papers p
       JOIN subjects s ON p.subject_id = s.id
       JOIN departments d ON p.department_id = d.id
       WHERE p.uploaded_by = ?
       ORDER BY p.created_at DESC`,
      [decoded.id]
    );

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Fetch API Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
