import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { searchPapers } from "@/lib/redis";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department_id") || searchParams.get("department");
    const semester = searchParams.get("semester");
    const type = searchParams.get("type");
    const year = searchParams.get("year");
    const search = searchParams.get("search");

    let query = `
      SELECT 
        p.id, p.semester, p.paper_type, p.year, p.original_filename, 
        p.download_count, p.created_at,
        s.name as subject_name, s.code as subject_code,
        d.name as department_name, d.code as department_code,
        u.name as uploaded_by
      FROM papers p
      JOIN subjects s ON p.subject_id = s.id
      JOIN departments d ON p.department_id = d.id
      JOIN users u ON p.uploaded_by = u.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (search) {
      const searchResult = await searchPapers(search);
      if (searchResult && searchResult.count > 0) {
        const ids = searchResult.papers.map(p => p.id);
        query += ` AND p.id IN (${ids.join(",")})`;
      } else {
        query += " AND (s.name LIKE ? OR s.code LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
      }
    }

    if (department) {
      query += " AND d.id = ?";
      params.push(department);
    }
    if (semester) {
      query += " AND p.semester = ?";
      params.push(semester);
    }
    if (type) {
      query += " AND p.paper_type = ?";
      params.push(type);
    }
    if (year) {
      query += " AND p.year = ?";
      params.push(year);
    }

    query += " ORDER BY p.created_at DESC";

    const [rows] = await db.query(query, params);
    
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
