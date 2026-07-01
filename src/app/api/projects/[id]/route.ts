import { NextRequest, NextResponse } from "next/server";
import { getProject, saveProject, deleteProject } from "@/lib/db";
import { revalidateProjectPaths } from "@/lib/revalidate";
import type { ProjectContent } from "@/types/content";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const p = await getProject(params.id);
  if (!p) return NextResponse.json({ error: "Projekt nicht gefunden." }, { status: 404 });
  return NextResponse.json(p);
}

/** Entwurf speichern (Draft). Veröffentlicht NICHT. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const p = await getProject(params.id);
  if (!p) return NextResponse.json({ error: "Projekt nicht gefunden." }, { status: 404 });
  const body = (await req.json()) as { draft?: ProjectContent; name?: string };
  if (body.draft) p.draft = body.draft;
  if (body.name) p.name = body.name;
  await saveProject(p);
  return NextResponse.json({ ok: true, updatedAt: p.updatedAt });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const p = await getProject(params.id);
  await deleteProject(params.id);
  // Gecachte öffentliche Seiten invalidieren, damit sie sofort 404 liefern
  if (p) revalidateProjectPaths(p.slug, p.customDomain);
  return NextResponse.json({ ok: true });
}
