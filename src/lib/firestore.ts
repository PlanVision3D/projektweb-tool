import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Firebase-Admin-Initialisierung.
 *
 * Wird NUR aktiv, wenn die drei Zugangsdaten als Umgebungsvariablen gesetzt
 * sind (auf Vercel). Lokal ohne diese Variablen bleibt `firestore = null`,
 * dann nutzt die App weiterhin den lokalen Datei-Speicher (data/db.json).
 */

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
// Private Key kann mit \n als Literal in der Env-Variable stehen -> echte Zeilenumbrüche herstellen
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

let _db: Firestore | null = null;

if (projectId && clientEmail && privateKey) {
  const app: App = getApps().length
    ? getApps()[0]
    : initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  _db = getFirestore(app);
  try {
    _db.settings({ ignoreUndefinedProperties: true });
  } catch {
    /* settings nur einmal setzbar – bei Hot-Reload ignorieren */
  }
}

export const firestore = _db;
export const usingFirestore = !!_db;
