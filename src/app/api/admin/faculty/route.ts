import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import db from "@/lib/db";
import bcrypt from "bcrypt";

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
    const [faculty]: any = await db.query(`
      SELECT u.id, u.name, u.email, u.role, u.is_active, u.department_id, d.name as department_name 
      FROM users u 
      LEFT JOIN departments d ON u.department_id = d.id 
      WHERE u.role != 'admin'
    `);
    return NextResponse.json({ success: true, data: faculty });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    const { name, email, role, department_id } = await req.json();
    if (!name || !email || !department_id) return NextResponse.json({ success: false, error: "Name, email and department are required" }, { status: 400 });

    const defaultPassword = await bcrypt.hash("faculty123", 10);

    await db.query("INSERT INTO users (name, email, password, role, department_id) VALUES (?, ?, ?, ?, ?)", [name, email, defaultPassword, role || "faculty", department_id]);
    return NextResponse.json({ success: true, message: "Faculty created successfully" });
  } catch (error) {
    console.error("Create Faculty Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    const { id, name, email, role, department_id, is_active } = await req.json();
    await db.query("UPDATE users SET name = ?, email = ?, role = ?, department_id = ?, is_active = ? WHERE id = ?", [name, email, role, department_id, is_active, id]);
    return NextResponse.json({ success: true, message: "Faculty updated successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await req.json();
    await db.query("DELETE FROM users WHERE id = ?", [id]);
    return NextResponse.json({ success: true, message: "Faculty deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
