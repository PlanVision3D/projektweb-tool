import { NextRequest, NextResponse } from "next/server";
import { getCustomerByEmail, createSession } from "@/lib/db";
import { verifyPassword, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const customer = await getCustomerByEmail(String(email || ""));
  if (!customer || !verifyPassword(String(password || ""), customer.passwordHash)) {
    return NextResponse.json({ error: "E-Mail oder Passwort ist falsch." }, { status: 401 });
  }
  const session = await createSession(customer.id);
  const res = NextResponse.json({ ok: true, name: customer.name });
  res.cookies.set(SESSION_COOKIE, session.token, {
    httpOnly: true, sameSite: "lax", path: "/",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(session.expiresAt),
  });
  return res;
}
