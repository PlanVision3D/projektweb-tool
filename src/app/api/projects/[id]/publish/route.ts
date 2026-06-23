import { NextRequest, NextResponse } from "next/server";
import { getProject, saveProject } from "@/lib/db";

/**
 * VERÖFFENTLICHEN: Entwurf -> Live.
 * Erst hier wird die Live-Version (published) mit dem aktuellen Entwurf
 * überschrieben. Vorher ist die Live-Seite unverändert.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const p = await getProject(params.id);
  if (!p) return NextResponse.json({ error: "Projekt nicht gefunden." }, { status: 404 });
  p.published = JSON.parse(JSON.stringify(p.draft));
  p.publishedAt = new Date().toISOString();
  await saveProject(p);
  return NextResponse.json({ ok: true, publishedAt: p.publishedAt, slug: p.slug });
}
