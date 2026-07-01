/**
 * MIGRATION: bestehende /uploads-Bilder -> Cloudflare R2
 * -----------------------------------------------------
 * Durchsucht alle Projekte tief nach "/uploads/..."-URLs, komprimiert die
 * zugehörige Datei (WebP, max. 1920px – wie src/lib/storage.ts), lädt sie nach
 * R2 und ersetzt die URL in der Datenbank.
 *
 * DB-Backend automatisch:
 *   • Firestore, wenn FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY gesetzt sind
 *   • sonst lokale data/db.json
 * Die Bilddateien werden immer aus dem lokalen public/uploads/ gelesen.
 *
 * Aufruf:
 *   node scripts/migrate-images-to-r2.mjs --dry   # nur anzeigen, nichts ändern
 *   node scripts/migrate-images-to-r2.mjs         # wirklich migrieren
 */
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const DRY = process.argv.includes("--dry");

// ---- .env.local einlesen (ohne bestehende Prozess-Variablen zu überschreiben) ----
try {
  for (const line of (await fs.readFile(".env.local", "utf8")).split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
} catch { /* keine .env.local – dann müssen die Variablen anders gesetzt sein */ }

// ---- R2 ----
const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL } = process.env;
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET || !R2_PUBLIC_URL) {
  console.error("❌ R2-Variablen fehlen (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL).");
  process.exit(1);
}
const publicBase = R2_PUBLIC_URL.replace(/\/+$/, "");
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

// ---- Kompression (identisch zu src/lib/storage.ts) ----
const MAX_WIDTH = 1920, WEBP_QUALITY = 80;
const RASTER = new Set([".png", ".jpg", ".jpeg", ".webp"]);
async function processImage(input, ext) {
  if (RASTER.has(ext)) {
    const buffer = await sharp(input).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true }).webp({ quality: WEBP_QUALITY }).toBuffer();
    return { buffer, ext: ".webp", contentType: "image/webp" };
  }
  if (ext === ".svg") return { buffer: input, ext: ".svg", contentType: "image/svg+xml" };
  if (ext === ".gif") return { buffer: input, ext: ".gif", contentType: "image/gif" };
  return { buffer: input, ext: ext || ".bin", contentType: "application/octet-stream" };
}

// ---- DB-Backend wählen ----
const useFirestore = !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
let firestore = null;
if (useFirestore) {
  const { initializeApp, getApps, cert } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  const app = getApps().length
    ? getApps()[0]
    : initializeApp({ credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }) });
  firestore = getFirestore(app);
}
console.log(`DB-Backend: ${useFirestore ? "Firestore (Produktion)" : "lokale data/db.json"}${DRY ? "  |  DRY-RUN (nichts wird geändert)" : ""}\n`);

// ---- Projekte laden ----
let dbCache = null; // nur für db.json
async function loadProjects() {
  if (firestore) {
    const snap = await firestore.collection("projects").get();
    return snap.docs.map((d) => d.data());
  }
  dbCache = JSON.parse(await fs.readFile("data/db.json", "utf8"));
  return dbCache.projects || [];
}
async function persist(projects, changedIds) {
  if (DRY) return;
  if (firestore) {
    for (const p of projects) if (changedIds.has(p.id)) await firestore.collection("projects").doc(p.id).set(p, { merge: false });
  } else {
    dbCache.projects = projects;
    await fs.writeFile("data/db.json", JSON.stringify(dbCache, null, 2), "utf8");
  }
}

// ---- Tiefes Durchlaufen: jeden String-Wert an sein Objekt/Key melden ----
function walkStrings(node, fn) {
  if (Array.isArray(node)) { node.forEach((x) => walkStrings(x, fn)); return; }
  if (node && typeof node === "object") {
    for (const k of Object.keys(node)) {
      if (typeof node[k] === "string") fn(node, k, node[k]);
      else walkStrings(node[k], fn);
    }
  }
}

const fmt = (b) => (b / 1024 / 1024).toFixed(2) + " MB";

// ===================================================================== //
const projects = await loadProjects();

// 1) Alle einzigartigen /uploads-URLs einsammeln
const urls = new Set();
for (const p of projects) walkStrings(p, (_o, _k, val) => { if (val.startsWith("/uploads/")) urls.add(val); });
console.log(`Gefundene /uploads-Referenzen: ${urls.size}\n`);
if (urls.size === 0) { console.log("Nichts zu migrieren. ✅"); process.exit(0); }

// 2) Jede Datei komprimieren + hochladen -> Mapping alt->neu
const map = new Map();
let before = 0, after = 0, missing = 0;
for (const url of urls) {
  const filePath = path.join(process.cwd(), "public", url); // /uploads/.. -> public/uploads/..
  let input;
  try { input = await fs.readFile(filePath); }
  catch { console.warn(`  ⚠ Datei fehlt lokal, übersprungen: ${url}`); missing++; continue; }

  const ext = (path.extname(url) || ".png").toLowerCase();
  const { buffer, ext: outExt, contentType } = await processImage(input, ext);
  const projectId = url.split("/")[2] || "migriert"; // /uploads/<projectId>/<file>
  const key = `uploads/${projectId}/${randomUUID()}${outExt}`;

  if (!DRY) {
    await s3.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: buffer, ContentType: contentType, CacheControl: "public, max-age=31536000, immutable" }));
  }
  const newUrl = `${publicBase}/${key}`;
  map.set(url, newUrl);
  before += input.length; after += buffer.length;
  console.log(`  ✓ ${fmt(input.length).padStart(9)} -> ${fmt(buffer.length).padStart(9)}   ${path.basename(url)}`);
}

// 3) URLs in den Projekten ersetzen und speichern
const changedIds = new Set();
for (const p of projects) {
  walkStrings(p, (o, k, val) => { if (map.has(val)) { o[k] = map.get(val); changedIds.add(p.id); } });
}
await persist(projects, changedIds);

// ---- Zusammenfassung ----
const saved = before - after;
const pct = before ? Math.round((saved / before) * 100) : 0;
console.log(`\n────────────────────────────────────────`);
console.log(`Migriert:      ${map.size} Bilder${missing ? `  (${missing} Dateien fehlten)` : ""}`);
console.log(`Größe vorher:  ${fmt(before)}`);
console.log(`Größe nachher: ${fmt(after)}   (−${pct} %)`);
console.log(`Projekte aktualisiert: ${changedIds.size}`);
console.log(DRY ? `\nDRY-RUN – es wurde NICHTS hochgeladen oder geändert. Zum echten Lauf ohne --dry starten.` : `\n✅ Fertig. Die DB verweist jetzt auf R2.`);
