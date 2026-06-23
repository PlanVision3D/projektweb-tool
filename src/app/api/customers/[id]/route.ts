import { NextRequest, NextResponse } from "next/server";
import { deleteCustomer, getCustomer, saveCustomer } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await deleteCustomer(params.id);
  return NextResponse.json({ ok: true });
}

/** Passwort eines Kunden zurücksetzen/ändern (Admin). */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const c = await getCustomer(params.id);
  if (!c) return NextResponse.json({ error: "Kunde nicht gefunden." }, { status: 404 });
  const { password, name } = await req.json();
  if (name) c.name = String(name).trim();
  if (password) c.passwordHash = hashPassword(String(password));
  await saveCustomer(c);
  return NextResponse.json({ ok: true });
}
