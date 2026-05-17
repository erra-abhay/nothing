import jwt from "jsonwebtoken";
import redis from "./redis";

export interface SessionData {
  id: number;
  email: string;
  role: string;
  department_id: number;
  sessionId: string;
}

export async function verifyActiveSession(token: string | undefined): Promise<SessionData | null> {
  try {
    if (!token) return null;

    // 1. Verify JWT signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as SessionData;
    
    if (!decoded || !decoded.id || !decoded.sessionId) return null;

    // 2. Check if this sessionId is still the "Active" one in Redis
    // This is the core of the single-session enforcement
    const activeSessionId = await redis.get(`user_session:${decoded.id}`);
    
    if (activeSessionId !== decoded.sessionId) {
      return null; // Session has been superseded by a newer login
    }

    return decoded;
  } catch (error) {
    return null;
  }
}
