import { NextRequest, NextResponse } from "next/server";
import { getProject, saveProject } from "@/lib/db";

/** Projekt einem oder mehreren Kunden (per E-Mail) zuweisen – Kundenbereich. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const p = await getProject(params.id);
  if (!p) return NextResponse.json({ error: "Projekt nicht gefunden." }, { status: 404 });
  const body = await req.json();
  const emails: string[] = Array.isArray(body.emails) ? body.emails : (body.email ? [body.email] : []);
  p.assignedCustomerEmails = Array.from(new Set(emails.map((e) => String(e).toLowerCase().trim()).filter(Boolean)));
  await saveProject(p);
  return NextResponse.json({ ok: true, assignedCustomerEmails: p.assignedCustomerEmails });
}
