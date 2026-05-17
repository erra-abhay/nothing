import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

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
    const [papers]: any = await db.query(`
      SELECT 
        p.id, p.semester, p.paper_type, p.year, p.original_filename, 
        p.download_count, p.created_at,
        s.name as subject_name, s.code as subject_code,
        d.name as department_name, d.code as department_code,
        u.name as uploaded_by, u.email as uploader_email
      FROM papers p
      JOIN subjects s ON p.subject_id = s.id
      JOIN departments d ON p.department_id = d.id
      JOIN users u ON p.uploaded_by = u.id
      ORDER BY p.created_at DESC
    `);
    return NextResponse.json({ success: true, data: papers });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
