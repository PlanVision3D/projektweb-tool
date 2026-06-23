import { NextRequest, NextResponse } from "next/server";
import { getProject, saveProject } from "@/lib/db";
import { parseProjectXlsx } from "@/lib/sheets/parseXlsx";

/** Datei (erneut) importieren und in den Entwurf übernehmen. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const p = await getProject(params.id);
  if (!p) return NextResponse.json({ error: "Projekt nicht gefunden." }, { status: 404 });
  const form = await req.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Keine Datei übermittelt." }, { status: 400 });
  }
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const parsed = parseProjectXlsx(buf);
    // Branding-Template-Wahl & vorhandene Bilder erhalten, Inhalte ersetzen
    parsed.content.template = p.draft.template;
    if (!parsed.content.hero.image && p.draft.hero.image) parsed.content.hero.image = p.draft.hero.image;
    if (parsed.content.gallery.length === 0) parsed.content.gallery = p.draft.gallery;
    if (parsed.content.floorplans.length === 0) parsed.content.floorplans = p.draft.floorplans;
    p.draft = parsed.content;
    p.warnings = parsed.warnings;
    await saveProject(p);
    return NextResponse.json({ ok: true, warnings: parsed.warnings });
  } catch (e: any) {
    return NextResponse.json({ error: "Datei konnte nicht gelesen werden: " + e.message }, { status: 400 });
  }
}
