import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Diese Middleware erfüllt zwei Aufgaben:
 *
 * 1) ADMIN-SCHUTZ – /, /projects, /kunden sind nur mit Login erreichbar.
 *
 * 2) CUSTOM-DOMAIN-ROUTING – ruft ein Besucher eine eigene Projekt-Domain auf
 *    (z.B. suedstadt-erbach.de), wird die Anfrage intern auf /_sites/<domain>/...
 *    umgeschrieben. Dort wird serverseitig das passende Projekt geladen und
 *    angezeigt – der Besucher sieht weiterhin die schöne Domain ohne /site/...
 */

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = (req.headers.get("host") || "").toLowerCase();

  // Hosts, die zur Tool-Anwendung selbst gehören (Admin + /site-Vorschau)
  const rootHost = (process.env.NEXT_PUBLIC_ROOT_HOST || "").toLowerCase();
  const isRootHost =
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.endsWith(".vercel.app") ||
    (rootHost && host === rootHost);

  // ---------- 1) CUSTOM DOMAIN ----------
  if (!isRootHost && host) {
    const url = req.nextUrl.clone();
    // Bilder/_next/api unangetastet lassen
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/uploads") ||
      pathname.includes(".")
    ) {
      return NextResponse.next();
    }
    url.pathname = `/domains/${host}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // Interne Domain-Routen nicht direkt über den Root-Host zugänglich machen
  if (isRootHost && pathname.startsWith("/domains")) {
    return NextResponse.rewrite(new URL("/404", req.url));
  }

  // ---------- 2) ADMIN-SCHUTZ ----------
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
  // Auf allen Pfaden laufen außer statischen Dateien und _next-Internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
