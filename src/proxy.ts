import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from "jose";

// Note: In Next.js Proxy/Middleware, we use a lighter check for Redis 
// if it's running in an edge-like environment.
export async function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // Protected routes
  const isFacultyRoute = pathname.startsWith("/faculty");
  const isAdminRoute = pathname.startsWith("/admin");
  const isApiRoute = pathname.startsWith("/api/admin") || pathname.startsWith("/api/faculty");

  if (isFacultyRoute || isAdminRoute || isApiRoute) {
    if (!token) {
      return handleUnauthorized(request);
    }

    try {
      // 1. Verify JWT signature using jose (Edge compatible)
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret');
      const { payload }: any = await jose.jwtVerify(token, secret);

      // 2. SECURITY: Check for session hijacking/superseded login
      // We call a lightweight internal API to check Redis session status
      // This ensures compatibility with the Proxy environment
      if (payload.id && payload.sessionId) {
        const sessionCheck = await fetch(`${request.nextUrl.origin}/api/auth/session-check?userId=${payload.id}&sessionId=${payload.sessionId}`, {
          method: 'GET',
          headers: { 'x-internal-key': process.env.INTERNAL_API_KEY || '' }
        });
        
        if (sessionCheck.status !== 200) {
            return handleUnauthorized(request);
        }
      }

      // 3. Role-based access control
      if (isAdminRoute && payload.role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url));
      }

      if (isFacultyRoute && payload.role !== "faculty" && payload.role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url));
      }

    } catch (error) {
      return handleUnauthorized(request);
    }
  }

  // Redirect logged in users away from login page
  if (pathname === "/login" && token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret');
      const { payload }: any = await jose.jwtVerify(token, secret);
      
      if (payload.role === "admin") {
        return NextResponse.redirect(new URL("/admin", request.url));
      } else if (payload.role === "faculty") {
        return NextResponse.redirect(new URL("/faculty", request.url));
      }
    } catch (error) {
      // Invalid token, allow login page
    }
  }

  return NextResponse.next();
}

function handleUnauthorized(request: NextRequest) {
  const isApi = request.nextUrl.pathname.startsWith('/api');
  if (isApi) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete("token");
  return response;
}

export const config = {
  matcher: ["/faculty/:path*", "/admin/:path*", "/api/admin/:path*", "/api/faculty/:path*", "/login"],
};
