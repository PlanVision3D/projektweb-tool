import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routen die NUR Admins sehen dürfen
const ADMIN_PATHS = ["/", "/projects", "/kunden"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin-Routen schützen
  const isAdminRoute =
    pathname === "/" ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/kunden");

  if (isAdminRoute) {
    const session = req.cookies.get("admin_session")?.value;
    if (!session || session !== "authenticated") {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/projects/:path*", "/kunden/:path*"],
};
