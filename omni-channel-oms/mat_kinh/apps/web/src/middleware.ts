import { type NextRequest, NextResponse } from "next/server";
import { ADMIN_TOKEN_COOKIE } from "@/lib/admin-cookies";

/**
 * Protect all /admin routes except /admin/login itself.
 * If the admin_token cookie is missing, redirect to the login page.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page through unconditionally
  if (pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_TOKEN_COOKIE)?.value;

  if (!token) {
    const loginUrl = new URL("/admin/login", request.url);
    // Preserve the original destination so we can redirect back after login (future enhancement)
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
