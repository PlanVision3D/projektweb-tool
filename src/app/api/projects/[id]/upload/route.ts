import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/db";
import { storeUpload } from "@/lib/storage";

// sharp + AWS-SDK brauchen die Node.js-Runtime (nicht Edge)
export const runtime = "nodejs";

/** Bild-Upload für ein Projekt: komprimiert (WebP) und nach R2 bzw. lokal gespeichert. Gibt die URL zurück. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const p = await getProject(params.id);
  if (!p) return NextResponse.json({ error: "Projekt nicht gefunden." }, { status: 404 });
  const form = await req.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Keine Datei übermittelt." }, { status: 400 });
  }
  try {
    const url = await storeUpload(params.id, file);
    return NextResponse.json({ url });
  } catch (e) {
    console.error("Upload fehlgeschlagen:", e);
    return NextResponse.json({ error: "Upload fehlgeschlagen." }, { status: 500 });
  }
}
