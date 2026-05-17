import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department");

    let query = `
      SELECT s.*, d.name as department_name, d.code as department_code,
             COUNT(p.id) as paper_count
      FROM subjects s
      JOIN departments d ON s.department_id = d.id
      LEFT JOIN papers p ON s.id = p.subject_id
    `;

    const params = [];
    if (department) {
      query += " WHERE s.department_id = ? OR d.code = ?";
      params.push(department, department);
    }

    query += " GROUP BY s.id ORDER BY s.name";

    const [subjects]: any = await db.query(query, params);
    return NextResponse.json({ success: true, data: subjects });
  } catch (error) {
    console.error("Fetch Subjects Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
