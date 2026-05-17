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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(req))) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const { name, code } = await req.json();
    await db.query("UPDATE departments SET name = ?, code = ? WHERE id = ?", [name, code, id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') return NextResponse.json({ success: false, error: "Duplicate entry" }, { status: 409 });
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(req))) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    await db.query("DELETE FROM departments WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
