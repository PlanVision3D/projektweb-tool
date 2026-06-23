import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/db";
import { buildExportHtml } from "@/lib/export-html";
import type { ProjectContent } from "@/types/content";

/**
 * Exportiert eine Projektseite als eigenständiges HTML (zum Einbetten in
 * WordPress "Custom HTML" oder Elementor "HTML"-Widget).
 *
 * GET  ?mode=published|draft  → nutzt die gespeicherte Version
 * POST { content }            → nutzt den übergebenen (aktuellen) Entwurf
 * Mit ?download=1 wird ein Datei-Download ausgelöst.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const project = await getProject(params.id);
  if (!project) return NextResponse.json({ error: "Projekt nicht gefunden." }, { status: 404 });

  const mode = req.nextUrl.searchParams.get("mode") === "published" ? "published" : "draft";
  const content = mode === "published" ? project.published : project.draft;
  if (!content) return NextResponse.json({ error: "Keine veröffentlichte Version vorhanden." }, { status: 400 });

  return respond(req, project.id, project.slug, project.name, content);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const project = await getProject(params.id);
  if (!project) return NextResponse.json({ error: "Projekt nicht gefunden." }, { status: 404 });

  let content: ProjectContent = project.draft;
  try {
    const body = await req.json();
    if (body?.content) content = body.content as ProjectContent;
  } catch {
    /* kein Body → gespeicherter Entwurf */
  }
  return respond(req, project.id, project.slug, project.name, content);
}

async function respond(req: NextRequest, id: string, slug: string, name: string, content: ProjectContent) {
  const origin = req.nextUrl.origin;
  const html = await buildExportHtml(content, { origin, slug, projectName: name });
  const download = req.nextUrl.searchParams.get("download") === "1";
  const safeName = (slug || name || "projekt").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase();

  const headers: Record<string, string> = { "Content-Type": "text/html; charset=utf-8" };
  if (download) headers["Content-Disposition"] = `attachment; filename="${safeName}.html"`;
  return new NextResponse(html, { headers });
}
