import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { listProjects, saveProject, slugify } from "@/lib/db";
import { emptyContent } from "@/lib/defaults";
import { parseProjectXlsx } from "@/lib/sheets/parseXlsx";
import type { Project } from "@/types/content";

export async function GET() {
  return NextResponse.json(await listProjects());
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const name = String(form.get("name") || "").trim();
  if (!name) return NextResponse.json({ error: "Projektname fehlt." }, { status: 400 });

  let content = emptyContent();
  let warnings: Project["warnings"] = [];
  let leadsSheetId: string | undefined;

  const file = form.get("file");
  if (file && file instanceof File && file.size > 0) {
    try {
      const buf = Buffer.from(await file.arrayBuffer());
      const parsed = parseProjectXlsx(buf);
      content = parsed.content;
      warnings = parsed.warnings;
      leadsSheetId = parsed.leadsSheetId;
    } catch (e: any) {
      return NextResponse.json({ error: "Datei konnte nicht gelesen werden: " + e.message }, { status: 400 });
    }
  }

  const now = new Date().toISOString();
  const existing = await listProjects();
  let slug = slugify(name);
  let i = 2;
  while (existing.some((p) => p.slug === slug)) slug = `${slugify(name)}-${i++}`;

  const project: Project = {
    id: randomUUID(),
    slug,
    name,
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    draft: content,
    published: null,
    warnings,
    leadsSheetId,
    assignedCustomerEmails: [],
  };
  await saveProject(project);
  return NextResponse.json({ id: project.id, slug: project.slug });
}
