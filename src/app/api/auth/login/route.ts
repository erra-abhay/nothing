import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import crypto from "crypto";
import redis from "@/lib/redis";
import { isAccountLocked, trackLoginAttempt, getRemainingLockoutTime } from "@/lib/security";
import { getClientIp } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const ip = getClientIp(req);

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 });
    }

    // Check if account is locked
    if (isAccountLocked(email, ip)) {
      const remainingTime = getRemainingLockoutTime(email, ip);
      return NextResponse.json({
        success: false,
        error: `Account temporarily locked. Please try again in ${remainingTime} minutes.`,
      }, { status: 429 });
    }

    const [users]: any = await db.query(
      "SELECT * FROM users WHERE email = ? AND is_active = TRUE",
      [email]
    );

    if (users.length === 0) {
      trackLoginAttempt(email, false, ip, { reason: "User not found" });
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      trackLoginAttempt(email, false, ip, { role: user.role, reason: "Invalid password" });
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    const sessionId = crypto.randomUUID();

    await redis.set(`user_session:${user.id}`, sessionId);

    const token = jwt.sign(
      { 
        id: user.id, 
        name: user.name,
        email: user.email, 
        role: user.role, 
        department_id: user.department_id, 
        sessionId: sessionId 
      },
      process.env.JWT_SECRET!,
      { expiresIn: "30m" }
    );

    trackLoginAttempt(email, true, ip, { role: user.role, userId: user.id });

    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: "strict",
      maxAge: 30 * 60,
      path: "/",
    });

    return NextResponse.json({ success: true, role: user.role });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
