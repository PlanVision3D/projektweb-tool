import { NextRequest, NextResponse } from "next/server";
import { addLead, listLeads, getProject } from "@/lib/db";

/** Neuen Lead aus dem Kontaktformular entgegennehmen (öffentlich). */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const project = await getProject(params.id);
  if (!project) return NextResponse.json({ error: "Projekt nicht gefunden." }, { status: 404 });
  let data: Record<string, string> = {};
  try {
    const body = await req.json();
    data = body && typeof body === "object" ? body : {};
  } catch {
    return NextResponse.json({ error: "Ungültige Daten." }, { status: 400 });
  }
  const lead = await addLead(params.id, data);
  return NextResponse.json({ ok: true, id: lead.id });
}

/** Leads eines Projekts abrufen (Admin/Kunde). */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json(await listLeads(params.id));
}
