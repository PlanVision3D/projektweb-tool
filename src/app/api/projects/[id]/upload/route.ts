import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { getProject } from "@/lib/db";

/** Bild-Upload für ein Projekt -> public/uploads/<projectId>/<file>. Gibt die URL zurück. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const p = await getProject(params.id);
  if (!p) return NextResponse.json({ error: "Projekt nicht gefunden." }, { status: 404 });
  const form = await req.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Keine Datei übermittelt." }, { status: 400 });
  }
  const dir = path.join(process.cwd(), "public", "uploads", params.id);
  await fs.mkdir(dir, { recursive: true });
  const ext = path.extname(file.name) || ".png";
  const fname = `${randomUUID()}${ext}`;
  await fs.writeFile(path.join(dir, fname), Buffer.from(await file.arrayBuffer()));
  const url = `/uploads/${params.id}/${fname}`;
  return NextResponse.json({ url });
}
