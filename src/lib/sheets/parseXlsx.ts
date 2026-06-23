import * as XLSX from "xlsx";
import type {
  ProjectContent, Unit, DataWarning, Fact, Feature, Usp, FaqItem, ProcessStep, LocationAdvantage,
} from "@/types/content";
import { emptyContent } from "@/lib/defaults";

/**
 * IMPORT: Excel/Google-Sheets-Export -> ProjectContent
 * ----------------------------------------------------
 * Erwartet die Struktur der Projektdaten-Vorlage:
 *   Tabelle 1: Inhalte (Impressum, Hero, Intro, USP, Besonderheiten, Lage, Ablauf, FAQ, Kontakt)
 *              Spalte A = Bezeichnung/Label, Spalte B = Wert
 *   Tabelle 2: Wohneinheiten (Wohnung | Geschoss | Fläche | Art | Mietpreis | Besonderheit | Status)
 *   Tabelle 3: Formular-Konfiguration + Branding (Primär-/Sekundärfarbe, Projektname)
 *
 * Robust: liest per Label (nicht per fester Zelle), toleriert Reihen-Verschiebungen
 * und sammelt fehlende Pflichtfelder als Warnungen.
 */

type Grid = (string | number | undefined)[][];

function toGrid(ws: XLSX.WorkSheet): Grid {
  return XLSX.utils.sheet_to_json<(string | number | undefined)[]>(ws, { header: 1, raw: true, defval: "" });
}

function s(v: unknown): string {
  return (v === undefined || v === null ? "" : String(v)).trim();
}

/** Spalte A -> B als flache Map (Labels sind in der Vorlage eindeutig). */
function labelMap(grid: Grid): Map<string, string> {
  const m = new Map<string, string>();
  for (const row of grid) {
    const key = s(row?.[0]);
    const val = s(row?.[1]);
    if (key && !m.has(key)) m.set(key, val);
  }
  return m;
}

export interface ParseResult {
  content: ProjectContent;
  warnings: DataWarning[];
  leadsSheetId?: string;
}

export function parseProjectXlsx(buffer: ArrayBuffer | Buffer): ParseResult {
  const wb = XLSX.read(buffer, { type: buffer instanceof Buffer ? "buffer" : "array" });
  const sheets = wb.SheetNames.map((n) => wb.Sheets[n]);
  const grid1 = sheets[0] ? toGrid(sheets[0]) : [];
  const grid2 = sheets[1] ? toGrid(sheets[1]) : [];
  const grid3 = sheets[2] ? toGrid(sheets[2]) : [];
  const L = labelMap(grid1);
  const L3 = labelMap(grid3);

  const content = emptyContent();
  const warnings: DataWarning[] = [];

  const need = (path: string, label: string, value: string) => {
    if (!value) warnings.push({ path, label, level: "missing", message: `„${label}“ fehlt in der Datei.` });
    return value;
  };

  /* --------------------------- Branding --------------------------- */
  content.branding.primaryColor = L3.get("Primärfarbe") || L3.get("Primärfarbe ") || content.branding.primaryColor;
  content.branding.secondaryColor = L3.get("Sekundärfarbe") || content.branding.secondaryColor;
  const logo = L3.get("Link zum Logo");
  if (logo && logo !== "-") content.branding.logoUrl = logo;

  /* ----------------------------- Hero ----------------------------- */
  content.hero.label = L.get("Label") || "";
  content.hero.headline = need("hero.headline", "Hauptüberschrift", L.get("Hauptüberschrift") || "");
  content.hero.subheadline = L.get("Unterüberschrift") || "";
  content.hero.shortDescription = L.get("Kurze Projektbeschreibung") || "";
  content.hero.ctaText = L.get("Call-to-Action Button") || "Jetzt anfragen!";
  content.hero.facts = [
    L.get("Fakten-Kachel – Wohneinheiten"),
    L.get("Fakten-Kachel – Zimmeranzahl"),
    L.get("Fakten-Kachel – Wohnfläche"),
    L.get("Fakten-Kachel – Projekttyp"),
  ].filter(Boolean).map((label) => ({ label: label as string }));

  /* ----------------------------- Intro ---------------------------- */
  content.intro.projectName = need("intro.projectName", "Projektname", L.get("Projektname") || L3.get("Projektname") || "");
  content.intro.paragraphs = [L.get("01 | Intro-Text"), L.get("02 | Intro-Text")].filter(Boolean) as string[];
  const introFacts: Fact[] = [];
  const pushFact = (label: string, value?: string) => { if (value) introFacts.push({ label, value }); };
  pushFact("Objektart", L.get("01 | Objektart"));
  pushFact("Adresse", L.get("02 | Objektadresse + PLZ und Ort"));
  pushFact("Baustart", clean(L.get("03 | Baustart")));
  pushFact("Bezugsfertig", clean(L.get("04 | Bezugsfertig")));
  pushFact("Energieeffizienz", clean(L.get("05 | Energieeffizienz")));
  content.intro.facts = introFacts;

  /* ------------------------------ USPs ----------------------------- */
  const usps: Usp[] = [];
  for (let i = 1; i <= 6; i++) {
    const n = String(i).padStart(2, "0");
    const title = L.get(`${n} | Alleinstellungsmerkmal - Überschrift`);
    const text = L.get(`${n} | Alleinstellungsmerkmal - Text`);
    if (title || text) usps.push({ title: title || "", text: text || "" });
  }
  content.usps = usps;

  /* -------------------------- Besonderheiten ----------------------- */
  const features: Feature[] = [];
  for (let i = 1; i <= 12; i++) {
    const n = String(i).padStart(2, "0");
    const title = s(L.get(`${n} | Titel`));
    const text = s(L.get(`${n} | Text`));
    const icon = s(L.get(`${n} | Icon`));
    if (title && text) features.push({ icon: icon === "-" ? "" : icon, title, text });
  }
  content.features = features;

  /* ------------------------------ Lage ----------------------------- */
  content.location.address = need(
    "location.address", "Objektadresse",
    L.get("02 | Objektadresse + PLZ und Ort") || L.get("Objektadresse und PLZ") || "",
  );
  content.location.description = L.get("Standortbeschreibung") || "";
  const adv: LocationAdvantage[] = [];
  for (let i = 1; i <= 8; i++) {
    const n = String(i).padStart(2, "0");
    const icon = s(L.get(`${n} | Standort-Vorteil - Icon`));
    const text = s(L.get(`${n} | Standort-Vorteil - Text`));
    if (text) adv.push({ icon, text });
  }
  content.location.advantages = adv;
  content.location.mapEmbedUrl = buildMapEmbed(L.get("Google Maps HTML"), content.location.address);

  /* ----------------------------- Ablauf ---------------------------- */
  const steps: ProcessStep[] = [];
  for (let i = 1; i <= 6; i++) {
    const title = L.get(`Schritt ${i} - Überschrift`);
    const desc = L.get(`Schritt ${i} - Beschreibung`);
    if (title || desc) steps.push({ title: title || "", description: desc || "" });
  }
  content.process = steps;

  /* ------------------------------ FAQ ------------------------------ */
  const faq: FaqItem[] = [];
  for (let i = 1; i <= 15; i++) {
    const n = String(i).padStart(2, "0");
    const q = L.get(`${n} | Frage`);
    const a = L.get(`${n} | Antwort`) || L.get(`${n} | Antwort `);
    if (q && a) faq.push({ question: q, answer: a });
  }
  content.faq = faq;

  /* ---------------------------- Kontakt ---------------------------- */
  content.contact.persons = [];
  for (let i = 1; i <= 3; i++) {
    const n = String(i).padStart(2, "0");
    const name = L.get(`${n} | Ansprechpartner`);
    if (name) {
      content.contact.persons.push({
        name,
        phone: L.get(`${n} | Telefon`) || L.get("Telefonnummer") || "",
        email: L.get(`${n} | E-Mail`) || "",
      });
    }
  }
  content.contact.website = L.get("Webseite") || L3.get("Domain") || "";
  content.contact.recipientEmails = [
    L3.get("01 | Empfänger E-Mail"), L3.get("02 | Empfänger E-Mail"), L3.get("03 | Empfänger E-Mail"),
    L.get("E-Mail"),
  ].filter((e) => e && e.includes("@")) as string[];

  /* ------------------------------ SEO ------------------------------ */
  content.seo.title = content.hero.headline
    ? `${content.intro.projectName || content.hero.headline} – ${content.hero.subheadline || ""}`.trim().replace(/[–-]\s*$/, "").trim()
    : content.intro.projectName;
  content.seo.description = content.hero.shortDescription || content.intro.paragraphs[0]?.slice(0, 160) || "";

  /* --------------------------- Impressum --------------------------- */
  content.legal = {
    companyName: need("legal.companyName", "Firmenname", L.get("Firmenname") || ""),
    street: L.get("Firmenadresse") || "",
    cityZip: L.get("PLZ und Ort") || "",
    representedBy: L.get("Vertreten durch") || "",
    phone: L.get("Telefonnummer") || "",
    email: L.get("E-Mail") || "",
    registerNumber: L.get("Handelsregisternummer") || "",
    registerCourt: L.get("Registergericht") || "",
    vatId: L.get("Umsatzsteueridentifikationsnummer") || "",
  };

  /* -------------------------- Wohneinheiten ------------------------ */
  content.units = parseUnits(grid2, warnings);

  /* ------------------- Formularfelder (Tabelle 3) ------------------ */
  const formFields = parseFormFields(grid3);
  if (formFields.length) content.contact.formFields = formFields;

  const leadsSheetId = L.get("Leads ID") || L3.get("Leads Sheet ID") || undefined;
  return { content, warnings, leadsSheetId };
}

function clean(v?: string): string {
  // Entfernt führende Marker wie "Baustart: " bleibt erhalten, aber "X..." Tippfehler weg
  if (!v) return "";
  return v.replace(/^X(?=Effizienz)/, "").trim();
}

function buildMapEmbed(raw: string | undefined, address: string): string {
  const r = s(raw);
  const m = r.match(/src="([^"]+)"/);
  if (m) return m[1];
  if (address) return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
  return "";
}

function parseUnits(grid: Grid, warnings: DataWarning[]): ProjectContent["units"] {
  const items: Unit[] = [];
  const floors: string[] = [];
  // Kopfzeile finden
  let start = 0;
  for (let i = 0; i < grid.length; i++) {
    if (s(grid[i]?.[0]).toLowerCase() === "wohnung") { start = i + 1; break; }
  }
  for (let i = start; i < grid.length; i++) {
    const row = grid[i];
    const name = s(row?.[0]);
    if (!name) continue;
    const floor = s(row?.[1]);
    if (floor && !floors.includes(floor)) floors.push(floor);
    const priceRaw = row?.[4];
    const price = typeof priceRaw === "number" ? priceRaw : parseFloat(s(priceRaw).replace(/[^\d,.]/g, "").replace(",", ".")) || null;
    items.push({
      id: `${slug(floor)}-${slug(name)}-${i}`,
      name,
      floor,
      area: s(row?.[2]),
      rooms: s(row?.[3]),
      price: Number.isFinite(price as number) ? (price as number) : null,
      extra: s(row?.[5]),
      status: mapStatus(s(row?.[6])),
    });
  }
  if (!items.length) {
    warnings.push({ path: "units.items", label: "Wohneinheiten", level: "missing", message: "Keine Wohneinheiten in Tabelle 2 gefunden." });
  }
  return {
    floors,
    items,
    floorPlans: [],
    note: "Alle Mietpreise verstehen sich als Kaltmiete. Carport-Stellplatz 68 €/Monat, Außenstellplatz 45 €/Monat, Abstell-/Fahrradraum 35 €/Monat.",
    intro: "Entdecken Sie alle 22 Wohneinheiten interaktiv: Wählen Sie ein Geschoss, sehen Sie den Grundriss und die verfügbaren Wohnungen mit Flächen und Mietpreisen.",
    finderHint: "Bitte wählen Sie ein Geschoss, um Grundriss, Flächen und Mietpreise zu sehen.",
  };
}

function mapStatus(raw: string): Unit["status"] {
  const v = raw.toLowerCase();
  if (v.includes("reserv")) return "reserviert";
  if (v.includes("vermiet")) return "vermietet";
  if (v.includes("verkauf")) return "verkauft";
  return "verfuegbar";
}

function parseFormFields(grid: Grid): ProjectContent["contact"]["formFields"] {
  const fields: ProjectContent["contact"]["formFields"] = [];
  for (const row of grid) {
    const label0 = s(row?.[0]);
    if (!/Frage/i.test(label0)) continue;
    const question = s(row?.[1]);
    const category = s(row?.[2]).toLowerCase();
    const optionsRaw = s(row?.[3]);
    if (!question) continue;
    const isText = category.includes("text");
    const isCheckbox = category.includes("checkbox") || /datenschutz/i.test(question);
    const options = optionsRaw ? optionsRaw.split(/\r?\n/).map((o) => o.trim()).filter(Boolean) : [];
    fields.push({
      key: slug(question).slice(0, 24) || `feld-${fields.length}`,
      label: question,
      type: isCheckbox ? "checkbox" : isText ? "text" : "select",
      required: true,
      options: options.length ? options : undefined,
    });
  }
  return fields;
}

function slug(v: string): string {
  return v.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
