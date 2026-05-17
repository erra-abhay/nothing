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
    const { name, code } = await req.json();
    if (!name || !code) return NextResponse.json({ success: false, error: "Name and code are required" }, { status: 400 });

    await db.query("INSERT INTO departments (name, code) VALUES (?, ?)", [name, code]);
    return NextResponse.json({ success: true, message: "Department created successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  
  try {
    const { id, name, code } = await req.json();
    if (!id || !name || !code) return NextResponse.json({ success: false, error: "ID, name and code are required" }, { status: 400 });

    await db.query("UPDATE departments SET name = ?, code = ? WHERE id = ?", [name, code, id]);
    return NextResponse.json({ success: true, message: "Department updated successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  
  try {
    const { id } = await req.json();
    await db.query("DELETE FROM departments WHERE id = ?", [id]);
    return NextResponse.json({ success: true, message: "Department deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
