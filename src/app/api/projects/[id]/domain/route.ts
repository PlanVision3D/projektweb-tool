import { NextRequest, NextResponse } from "next/server";
import { getProject, saveProject, getProjectByDomain, normalizeDomain } from "@/lib/db";
import { revalidateProjectPaths } from "@/lib/revalidate";

/** Eigene Domain für ein Projekt setzen oder entfernen. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const p = await getProject(params.id);
  if (!p) return NextResponse.json({ error: "Projekt nicht gefunden." }, { status: 404 });
  const previousDomain = p.customDomain;

  const body = await req.json();
  let raw = String(body.domain ?? "").trim();

  // Eingabe säubern: https://, Pfade, www. und Port entfernen
  raw = raw.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
  const domain = raw ? normalizeDomain(raw) : "";

  if (domain) {
    // grobe Plausibilitätsprüfung
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
      return NextResponse.json({ error: "Bitte eine gültige Domain eingeben, z.B. meine-domain.de" }, { status: 400 });
    }
    // Domain darf nicht schon einem anderen Projekt gehören
    const existing = await getProjectByDomain(domain);
    if (existing && existing.id !== p.id) {
      return NextResponse.json({ error: `Diese Domain ist bereits dem Projekt „${existing.name}“ zugewiesen.` }, { status: 409 });
    }
    p.customDomain = domain;
  } else {
    delete p.customDomain;
  }

  await saveProject(p);

  // Alte Domain (falls geändert/entfernt) und neue Domain aus dem Cache erneuern
  if (previousDomain && previousDomain !== p.customDomain) {
    revalidateProjectPaths(undefined, previousDomain);
  }
  revalidateProjectPaths(p.slug, p.customDomain);

  return NextResponse.json({ ok: true, customDomain: p.customDomain ?? null });
}
