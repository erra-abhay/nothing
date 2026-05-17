import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import db from "@/lib/db";

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
    const { name, code, department_id, semester } = await req.json();
    if (!name || !code || !department_id || !semester) return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 });

    await db.query("INSERT INTO subjects (name, code, department_id, semester) VALUES (?, ?, ?, ?)", [name, code, department_id, semester]);
    return NextResponse.json({ success: true, message: "Subject created successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  
  try {
    const { id, name, code, department_id, semester } = await req.json();
    if (!id || !name || !code || !department_id || !semester) return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 });

    await db.query("UPDATE subjects SET name = ?, code = ?, department_id = ?, semester = ? WHERE id = ?", [name, code, department_id, semester, id]);
    return NextResponse.json({ success: true, message: "Subject updated successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  
  try {
    const { id } = await req.json();
    await db.query("DELETE FROM subjects WHERE id = ?", [id]);
    return NextResponse.json({ success: true, message: "Subject deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
