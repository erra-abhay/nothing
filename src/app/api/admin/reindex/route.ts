import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { initSearchIndex, indexPaper } from "@/lib/redis";
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

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    // Initialize index
    await initSearchIndex();

    // Fetch all papers
    const [papers]: any = await db.query(`
      SELECT p.id, p.semester, p.paper_type, p.year, s.name as subject_name, s.code as subject_code, d.name as department_name
      FROM papers p
      JOIN subjects s ON p.subject_id = s.id
      JOIN departments d ON p.department_id = d.id
    `);

    // Index each paper
    for (const paper of papers) {
      await indexPaper(paper);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully re-indexed ${papers.length} papers.` 
    });
  } catch (error) {
    console.error("Re-index Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
