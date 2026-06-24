import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { password } = await req.json();

  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  if (password !== adminPassword) {
    return NextResponse.json({ error: "Falsches Passwort." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_session", "authenticated", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 Tage
    path: "/",
  });
  return res;
}
