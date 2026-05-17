import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const [departments]: any = await db.query(`
      SELECT d.*, COUNT(p.id) as paper_count
      FROM departments d
      LEFT JOIN papers p ON d.id = p.department_id
      GROUP BY d.id
      ORDER BY d.name
    `);
    return NextResponse.json({ success: true, data: departments });
  } catch (error) {
    console.error("Fetch Departments Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
