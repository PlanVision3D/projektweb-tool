/**
 * SEED: "Wohnen in der Südstadt" 1:1 anlegen – inkl. echtem Polygon-Wohnungsnavigator.
 * Dev-Server muss laufen. Medien & navigator.json aus dem Projektordner.
 */
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const BASE = process.env.BASE || "http://localhost:4000";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const PARENT = path.resolve(process.cwd(), "..");
const XLSX_FILE = "DATEN _ Projektwebseite - WOHNEN IN DER SÜDSTADT.xlsx";
const GR = "04 _ Marketinggrundrisse/Grundrisse Wohnungsfinder";
const ETAGE = "04 _ Marketinggrundrisse/Etagengrundrisse";

const uploadCache = new Map();
async function upload(projectId, file) {
  if (uploadCache.has(file)) return uploadCache.get(file);
  const buf = await readFile(path.join(PARENT, file));
  const fd = new FormData();
  fd.append("file", new Blob([buf]), path.basename(file));
  const res = await fetch(`${BASE}/api/projects/${projectId}/upload`, { method: "POST", body: fd });
  const data = await res.json();
  if (!data.url) throw new Error("Upload fehlgeschlagen: " + file + " → " + JSON.stringify(data));
  uploadCache.set(file, data.url);
  return data.url;
}
const img = (url, caption) => ({ url, caption });

/** Bildquelle der Navigator-Artboards auf lokale Dateien mappen. */
function localForNavImage(imageUrl) {
  const base = imageUrl.split("/").pop() || "";
  if (/Hauptansicht/i.test(base)) return "Hauptansicht.webp";
  if (/E-EG-A-A/i.test(base)) return `${ETAGE}/E EG A-A(1_100)_FOLDER page3_005_small_Fn.png`;
  const m = base.match(/FAMILIENHAUSES_A3_(\d+)/i);
  if (m) return `${GR}/FAMILIENHAUSES_A3_${m[1]}.jpg`;
  return null;
}

async function buildNavigator(projectId) {
  const cfg = JSON.parse(await readFile(path.join(HERE, "navigator.json"), "utf8"));
  const artboards = [];
  for (const ab of cfg.artboards) {
    const local = localForNavImage(ab.image_url);
    if (!local) { console.warn("kein lokales Bild für", ab.image_url); continue; }
    const url = await upload(projectId, local);
    const zones = (ab.children || [])
      .filter((c) => c.type === "poly" && c.points)
      .map((c) => ({
        id: c.id,
        title: c.title,
        tooltip: c.tooltip || c.title,
        target: c.actions?.artboard,
        // Polygonpunkte (relativ zur Zonen-Bounding-Box) -> absolute Artboard-Prozente
        points: c.points.map((p) => ({
          x: c.x + (p.x / 100) * c.width,
          y: c.y + (p.y / 100) * c.height,
        })),
      }));
    artboards.push({ id: ab.id, title: ab.title, image: { url }, width: ab.width, height: ab.height, zones, backTarget: ab.backTarget });
  }
  return { rootId: cfg.artboards[0].id, artboards };
}

async function main() {
  // 0) altes Beispiel entfernen
  const all = await (await fetch(`${BASE}/api/projects`)).json();
  for (const p of all) if (p.name === "Wohnen in der Südstadt") {
    await fetch(`${BASE}/api/projects/${p.id}`, { method: "DELETE" });
    console.log("altes Beispielprojekt entfernt:", p.id);
  }

  // 1) anlegen + xlsx import
  const fd = new FormData();
  fd.append("name", "Wohnen in der Südstadt");
  fd.append("file", new Blob([await readFile(path.join(PARENT, XLSX_FILE))]), XLSX_FILE);
  let res = await fetch(`${BASE}/api/projects`, { method: "POST", body: fd });
  const created = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(created));
  const id = created.id;
  console.log("Projekt:", id, "/", created.slug);

  // 2) Medien
  const heroUrl = await upload(id, "33f474a0-fa4d-4d42-bcc2-18488b68de39 (1).png");
  const logoUrl = await upload(id, "wohnen-in-der-sueedstatd-logo-1-1-Photoroom-e1781270320984.webp");
  const introImgs = [
    img(await upload(id, "81531b64-ce21-4078-9314-fba68fae9692.png"), "Südansicht"),
    img(await upload(id, "Hauptansicht.webp"), "Vogelperspektive mit Dachbegrünung"),
    img(await upload(id, "d7756567-a9c0-4f6c-8ded-d65a98e810cc.png"), "Barrierefreier Zugang"),
  ];
  const interiors = [
    img(await upload(id, "Wohnen_Essen_Kochen-1024x768.png"), "Wohnen & Essen"),
    img(await upload(id, "Wohnen_Essen_Kochen_4-1024x768.png"), "Offener Wohnbereich"),
    img(await upload(id, "Wohnen_Essen_Kochen_6-1024x768.png"), "Küche"),
    img(await upload(id, "Schlafzimmer_3-1024x768.png"), "Schlafzimmer"),
    img(await upload(id, "e986a4ff-6725-4992-ae25-2b2da119c5e4-1024x768.png"), "Barrierefreies Bad"),
  ];
  const uspBarrierefrei = await upload(id, "d7756567-a9c0-4f6c-8ded-d65a98e810cc.png");
  const uspNaturnah = await upload(id, "d716b92d-e9c9-440e-92d1-d452a9aa1736.png");
  console.log("Baue Wohnungsnavigator …");
  const navigator = await buildNavigator(id);
  console.log("Navigator: ", navigator.artboards.length, "Artboards");

  // 3) Entwurf patchen
  const project = await (await fetch(`${BASE}/api/projects/${id}`)).json();
  const d = project.draft;
  d.hero.image = { url: heroUrl, alt: "Wohnen in der Südstadt" };
  d.branding.logoUrl = logoUrl;
  d.intro.images = introImgs;
  if (d.usps[0]) d.usps[0].image = { url: uspBarrierefrei };
  if (d.usps[1]) d.usps[1].image = { url: uspNaturnah };
  d.units.buildingImage = { url: navigator.artboards[0].image.url };
  d.units.navigator = navigator;
  d.virtualTour.images = interiors.slice(0, 3);
  d.gallery = interiors;
  d.location.image = undefined; // im Original kein Extra-Bild

  // Besonderheiten: echte Icons statt Emojis
  const featureIcon = { "Naturnah": "tree", "Energieeffizienz": "energy", "Barrierefrei": "accessible", "Parken": "parking", "Vernetzt": "connected", "Provisionsfrei": "money-off", "E-Ladestation": "ev", "Zentral": "city" };
  d.features.forEach((f) => { f.iconKey = featureIcon[f.title] || "home"; });

  // Lage: Icons + "Kitas/Schulen"-Eintrag entfernen
  d.location.advantages = d.location.advantages
    .filter((a) => !/kita|schule/i.test(a.text))
    .map((a) => {
      const t = a.text.toLowerCase(); let k = "pin";
      if (/innenstadt|zentrum/.test(t)) k = "city";
      if (/bahnhof|bahn/.test(t)) k = "train";
      if (/schloss/.test(t)) k = "castle";
      if (/einkä|einkauf/.test(t)) k = "cart";
      if (/odenwald|natur/.test(t)) k = "forest";
      return { ...a, iconKey: k };
    });

  // Agentur-Stempel (Technische Umsetzung)
  d.branding.agencyLogoUrl = await upload(id, "Stempel-PlanVision3D-1-768x524-1.webp");
  res = await fetch(`${BASE}/api/projects/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draft: d }) });
  if (!res.ok) throw new Error("PATCH fehlgeschlagen");

  // 4) veröffentlichen
  res = await fetch(`${BASE}/api/projects/${id}/publish`, { method: "POST" });
  const pub = await res.json();

  // 5) Beispiel-Leads
  const leads = [
    { "Für welche Wohnungsgröße interessieren Sie sich?": "3-Zimmer-Wohnung", "Interessieren Sie sich für Kauf oder Miete?": "Miete", "Wann sind Sie am besten erreichbar?": "Vormittags", "Ihr vollständiger Name": "Maria Schneider", "Ihre Telefonnummer": "0171 2345678", "Ihre E-Mail-Adresse": "m.schneider@example.de" },
    { "Für welche Wohnungsgröße interessieren Sie sich?": "2-Zimmer-Wohnung", "Interessieren Sie sich für Kauf oder Miete?": "Miete", "Wann sind Sie am besten erreichbar?": "Abends", "Ihr vollständiger Name": "Hans Becker", "Ihre Telefonnummer": "0160 9876543", "Ihre E-Mail-Adresse": "hans.becker@example.de" },
  ];
  for (const l of leads) await fetch(`${BASE}/api/projects/${id}/leads`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(l) });

  console.log("Live:", `${BASE}/site/${pub.slug}`);
  console.log("Admin:", `${BASE}/projects/${id}`);
  console.log("Warnungen:", project.warnings.length);
}
main().catch((e) => { console.error(e); process.exit(1); });
