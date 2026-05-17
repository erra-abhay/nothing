import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

import { getCachedData, setCachedData } from "@/lib/redis";

export async function GET(req: NextRequest) {
  try {
    const cacheKey = "public_stats";
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      return NextResponse.json({ success: true, data: cachedData });
    }

    const [mostDownloaded]: any = await db.query(`
      SELECT 
        p.id, p.semester, p.paper_type, p.year, p.download_count,
        s.name as subject_name, s.code as subject_code,
        d.name as department_name, d.code as department_code
      FROM papers p
      JOIN subjects s ON p.subject_id = s.id
      JOIN departments d ON p.department_id = d.id
      ORDER BY p.download_count DESC
      LIMIT 10
    `);

    const [recentUploads]: any = await db.query(`
      SELECT 
        p.id, p.semester, p.paper_type, p.year, p.created_at,
        s.name as subject_name, s.code as subject_code,
        d.name as department_name, d.code as department_code,
        u.name as uploaded_by
      FROM papers p
      JOIN subjects s ON p.subject_id = s.id
      JOIN departments d ON p.department_id = d.id
      JOIN users u ON p.uploaded_by = u.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `);

    const [topSubjects]: any = await db.query(`
      SELECT 
        s.id, s.name, s.code,
        d.name as department_name,
        SUM(p.download_count) as total_downloads,
        COUNT(p.id) as paper_count
      FROM subjects s
      JOIN departments d ON s.department_id = d.id
      LEFT JOIN papers p ON s.id = p.subject_id
      GROUP BY s.id
      ORDER BY total_downloads DESC
      LIMIT 10
    `);

    const [counts]: any = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM papers) as total_papers,
        (SELECT COUNT(*) FROM subjects) as total_subjects,
        (SELECT COUNT(*) FROM departments) as total_departments,
        (SELECT SUM(download_count) FROM papers) as total_downloads
    `);

    const data = {
      mostDownloaded,
      recentUploads,
      topSubjects,
      counts: counts[0]
    };

    // Cache for 5 minutes
    await setCachedData(cacheKey, data, 300);

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error("Fetch Stats Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
