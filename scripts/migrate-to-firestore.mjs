/**
 * Einmalige Migration: überträgt data/db.json nach Cloud Firestore.
 *
 * Voraussetzung: .env.local enthält
 *   FIREBASE_PROJECT_ID=...
 *   FIREBASE_CLIENT_EMAIL=...
 *   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
 *
 * Ausführen:  node scripts/migrate-to-firestore.mjs
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const resolve = (rel) => fileURLToPath(new URL(rel, import.meta.url));

// --- .env.local laden (einfacher Parser) ---
function loadEnv(file) {
  try {
    const raw = readFileSync(file, "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let val = m[2];
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (!(m[1] in process.env)) process.env[m[1]] = val;
    }
  } catch { /* keine .env.local – evtl. sind die Vars schon gesetzt */ }
}
loadEnv(resolve("../.env.local"));

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("❌ Firebase-Zugangsdaten fehlen (FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY).");
  process.exit(1);
}

const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore(app);
db.settings({ ignoreUndefinedProperties: true });

const data = JSON.parse(readFileSync(resolve("../data/db.json"), "utf8"));

async function upload(collection, items, idField) {
  let n = 0;
  for (const item of items ?? []) {
    const id = String(item[idField]);
    await db.collection(collection).doc(id).set(item, { merge: false });
    n++;
  }
  console.log(`  ✓ ${collection}: ${n} Dokumente`);
}

console.log("→ Migration nach Firestore startet…");
await upload("projects", data.projects, "id");
await upload("customers", data.customers, "id");
await upload("leads", data.leads, "id");
await upload("sessions", data.sessions, "token");
console.log("✅ Fertig! Alle Daten sind in Firestore.");
process.exit(0);
