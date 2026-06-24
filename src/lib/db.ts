import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Project, Lead, LeadStatus, Customer, Session } from "@/types/content";
import { firestore, usingFirestore } from "./firestore";

/**
 * PERSISTENZ-SCHICHT (Repository-Pattern)
 * ---------------------------------------
 * Zwei austauschbare Backends, automatisch gewählt:
 *
 *  • LOKAL (kein Firebase konfiguriert): JSON-Datei data/db.json – läuft sofort,
 *    ideal zum Entwickeln.
 *  • PRODUKTION auf Vercel (Firebase-Env gesetzt): Cloud Firestore – schreibbar
 *    und dauerhaft. Je ein Dokument pro Projekt / Kunde / Lead / Session.
 *
 * Die übrige App spricht NUR über die unten exportierten Funktionen mit den Daten.
 */

const DB_PATH = path.join(process.cwd(), "data", "db.json");

interface DbShape {
  projects: Project[];
  leads: Lead[];
  customers: Customer[];
  sessions: Session[];
}

/* ===================================================================== */
/*  Schema-Normalisierung (für beide Backends)                            */
/* ===================================================================== */

function normalizeContent(c: any): any {
  if (!c) return c;
  c.branding = c.branding || { primaryColor: "#396189", secondaryColor: "#ceb475" };
  c.branding.ctaColor = c.branding.ctaColor || "#6f9a3c";
  c.branding.badgeColor = c.branding.badgeColor || "#b56a43";
  c.intro = c.intro || { projectName: "", paragraphs: [], facts: [] };
  c.intro.images = c.intro.images || [];
  c.units = c.units || { floors: [], items: [] };
  c.units.floorPlans = c.units.floorPlans || [];
  c.virtualTour = c.virtualTour || { heading: "Virtueller Rundgang", subheading: "Musterwohnung", images: [] };
  c.virtualTour.images = c.virtualTour.images || [];
  c.location = c.location || { address: "", advantages: [] };
  c.location.advantages = c.location.advantages || [];
  c.gallery = c.gallery || [];
  c.floorplans = c.floorplans || [];
  return c;
}

function normalizeProject(p: Project): Project {
  p.draft = normalizeContent(p.draft);
  if (p.published) p.published = normalizeContent(p.published);
  const legacy = (p as any).assignedCustomerEmail;
  if (!Array.isArray(p.assignedCustomerEmails)) p.assignedCustomerEmails = legacy ? [legacy] : [];
  delete (p as any).assignedCustomerEmail;
  return p;
}

/* ===================================================================== */
/*  Datei-Backend (lokal)                                                 */
/* ===================================================================== */

async function readDb(): Promise<DbShape> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<DbShape>;
    return {
      projects: (parsed.projects ?? []).map(normalizeProject),
      leads: parsed.leads ?? [],
      customers: parsed.customers ?? [],
      sessions: parsed.sessions ?? [],
    };
  } catch {
    return { projects: [], leads: [], customers: [], sessions: [] };
  }
}

async function writeDb(db: DbShape): Promise<void> {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

/* ===================================================================== */
/*  Firestore-Backend (Produktion)                                        */
/* ===================================================================== */

const COL = { projects: "projects", leads: "leads", customers: "customers", sessions: "sessions" } as const;

/** Entfernt das interne Firestore-Dokument-Wrapping und liefert reine Daten. */
function docData<T>(snap: FirebaseFirestore.DocumentSnapshot): T | null {
  return snap.exists ? (snap.data() as T) : null;
}

/* ===================================================================== */
/*  Hilfsfunktionen (pur)                                                 */
/* ===================================================================== */

export function normalizeDomain(host: string): string {
  return host.toLowerCase().trim().replace(/:\d+$/, "").replace(/^www\./, "");
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* ===================================================================== */
/*  Projekte                                                              */
/* ===================================================================== */

export async function listProjects(): Promise<Project[]> {
  if (usingFirestore && firestore) {
    const snap = await firestore.collection(COL.projects).get();
    const projects = snap.docs.map((d) => normalizeProject(d.data() as Project));
    return projects.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }
  const db = await readDb();
  return db.projects.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export async function getProject(id: string): Promise<Project | null> {
  if (usingFirestore && firestore) {
    const p = docData<Project>(await firestore.collection(COL.projects).doc(id).get());
    return p ? normalizeProject(p) : null;
  }
  const db = await readDb();
  return db.projects.find((p) => p.id === id) ?? null;
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  if (usingFirestore && firestore) {
    const snap = await firestore.collection(COL.projects).where("slug", "==", slug).limit(1).get();
    return snap.empty ? null : normalizeProject(snap.docs[0].data() as Project);
  }
  const db = await readDb();
  return db.projects.find((p) => p.slug === slug) ?? null;
}

export async function getProjectByDomain(host: string): Promise<Project | null> {
  const d = normalizeDomain(host);
  if (!d) return null;
  if (usingFirestore && firestore) {
    const snap = await firestore.collection(COL.projects).where("customDomain", "==", d).limit(1).get();
    return snap.empty ? null : normalizeProject(snap.docs[0].data() as Project);
  }
  const db = await readDb();
  return db.projects.find((p) => p.customDomain && normalizeDomain(p.customDomain) === d) ?? null;
}

export async function saveProject(project: Project): Promise<Project> {
  project.updatedAt = new Date().toISOString();
  if (usingFirestore && firestore) {
    await firestore.collection(COL.projects).doc(project.id).set(project, { merge: false });
    return project;
  }
  const db = await readDb();
  const idx = db.projects.findIndex((p) => p.id === project.id);
  if (idx >= 0) db.projects[idx] = project;
  else db.projects.push(project);
  await writeDb(db);
  return project;
}

export async function deleteProject(id: string): Promise<void> {
  if (usingFirestore && firestore) {
    await firestore.collection(COL.projects).doc(id).delete();
    const leads = await firestore.collection(COL.leads).where("projectId", "==", id).get();
    await Promise.all(leads.docs.map((d) => d.ref.delete()));
    return;
  }
  const db = await readDb();
  db.projects = db.projects.filter((p) => p.id !== id);
  db.leads = db.leads.filter((l) => l.projectId !== id);
  await writeDb(db);
}

/* ===================================================================== */
/*  Leads                                                                 */
/* ===================================================================== */

export async function addLead(projectId: string, data: Record<string, string>): Promise<Lead> {
  const lead: Lead = { id: randomUUID(), projectId, createdAt: new Date().toISOString(), status: "neu", data };
  if (usingFirestore && firestore) {
    await firestore.collection(COL.leads).doc(lead.id).set(lead);
    return lead;
  }
  const db = await readDb();
  db.leads.push(lead);
  await writeDb(db);
  return lead;
}

export async function listLeads(projectId: string): Promise<Lead[]> {
  if (usingFirestore && firestore) {
    const snap = await firestore.collection(COL.leads).where("projectId", "==", projectId).get();
    return snap.docs.map((d) => d.data() as Lead).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  const db = await readDb();
  return db.leads.filter((l) => l.projectId === projectId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function countLeads(projectId: string): Promise<number> {
  if (usingFirestore && firestore) {
    const snap = await firestore.collection(COL.leads).where("projectId", "==", projectId).count().get();
    return snap.data().count;
  }
  const db = await readDb();
  return db.leads.filter((l) => l.projectId === projectId).length;
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<void> {
  if (usingFirestore && firestore) {
    await firestore.collection(COL.leads).doc(id).update({ status });
    return;
  }
  const db = await readDb();
  const lead = db.leads.find((l) => l.id === id);
  if (lead) { lead.status = status; await writeDb(db); }
}

/* ===================================================================== */
/*  Kunden                                                                */
/* ===================================================================== */

export async function listCustomers(): Promise<Customer[]> {
  if (usingFirestore && firestore) {
    const snap = await firestore.collection(COL.customers).get();
    return snap.docs.map((d) => d.data() as Customer).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  const db = await readDb();
  return db.customers.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getCustomer(id: string): Promise<Customer | null> {
  if (usingFirestore && firestore) {
    return docData<Customer>(await firestore.collection(COL.customers).doc(id).get());
  }
  const db = await readDb();
  return db.customers.find((c) => c.id === id) ?? null;
}

export async function getCustomerByEmail(email: string): Promise<Customer | null> {
  const e = email.toLowerCase().trim();
  if (usingFirestore && firestore) {
    const snap = await firestore.collection(COL.customers).where("email", "==", e).limit(1).get();
    return snap.empty ? null : (snap.docs[0].data() as Customer);
  }
  const db = await readDb();
  return db.customers.find((c) => c.email === e) ?? null;
}

export async function saveCustomer(customer: Customer): Promise<Customer> {
  if (usingFirestore && firestore) {
    await firestore.collection(COL.customers).doc(customer.id).set(customer, { merge: false });
    return customer;
  }
  const db = await readDb();
  const idx = db.customers.findIndex((c) => c.id === customer.id);
  if (idx >= 0) db.customers[idx] = customer;
  else db.customers.push(customer);
  await writeDb(db);
  return customer;
}

export async function deleteCustomer(id: string): Promise<void> {
  if (usingFirestore && firestore) {
    const cust = docData<Customer>(await firestore.collection(COL.customers).doc(id).get());
    await firestore.collection(COL.customers).doc(id).delete();
    // Sessions des Kunden löschen
    const sess = await firestore.collection(COL.sessions).where("customerId", "==", id).get();
    await Promise.all(sess.docs.map((d) => d.ref.delete()));
    // Projektzuweisung lösen
    if (cust) {
      const assigned = await firestore.collection(COL.projects).where("assignedCustomerEmails", "array-contains", cust.email).get();
      await Promise.all(assigned.docs.map((d) => {
        const p = d.data() as Project;
        const emails = (p.assignedCustomerEmails || []).filter((e) => e !== cust.email);
        return d.ref.update({ assignedCustomerEmails: emails });
      }));
    }
    return;
  }
  const db = await readDb();
  const cust = db.customers.find((c) => c.id === id);
  db.customers = db.customers.filter((c) => c.id !== id);
  db.sessions = db.sessions.filter((s) => s.customerId !== id);
  if (cust) db.projects.forEach((p) => { p.assignedCustomerEmails = (p.assignedCustomerEmails || []).filter((e) => e !== cust.email); });
  await writeDb(db);
}

/** Projekte eines Kunden (per zugewiesener E-Mail). */
export async function projectsForCustomer(email: string): Promise<Project[]> {
  const e = email.toLowerCase().trim();
  if (usingFirestore && firestore) {
    const snap = await firestore.collection(COL.projects).where("assignedCustomerEmails", "array-contains", e).get();
    return snap.docs.map((d) => normalizeProject(d.data() as Project));
  }
  const db = await readDb();
  return db.projects.map(normalizeProject).filter((p) => p.assignedCustomerEmails.includes(e));
}

/** Prüft, ob ein Kunde Zugriff auf ein Projekt hat. */
export async function customerHasAccess(email: string, projectId: string): Promise<boolean> {
  const p = await getProject(projectId);
  return !!p && p.assignedCustomerEmails.includes(email.toLowerCase().trim());
}

/* ===================================================================== */
/*  Sessions                                                              */
/* ===================================================================== */

export async function createSession(customerId: string): Promise<Session> {
  const token = randomUUID() + randomUUID().replace(/-/g, "");
  const now = Date.now();
  const session: Session = {
    token, customerId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + 1000 * 60 * 60 * 24 * 30).toISOString(),
  };
  if (usingFirestore && firestore) {
    await firestore.collection(COL.sessions).doc(token).set(session);
    return session;
  }
  const db = await readDb();
  db.sessions.push(session);
  await writeDb(db);
  return session;
}

export async function getSessionCustomer(token: string | undefined): Promise<Customer | null> {
  if (!token) return null;
  if (usingFirestore && firestore) {
    const s = docData<Session>(await firestore.collection(COL.sessions).doc(token).get());
    if (!s || new Date(s.expiresAt).getTime() < Date.now()) return null;
    return docData<Customer>(await firestore.collection(COL.customers).doc(s.customerId).get());
  }
  const db = await readDb();
  const s = db.sessions.find((x) => x.token === token);
  if (!s || new Date(s.expiresAt).getTime() < Date.now()) return null;
  return db.customers.find((c) => c.id === s.customerId) ?? null;
}

export async function deleteSession(token: string | undefined): Promise<void> {
  if (!token) return;
  if (usingFirestore && firestore) {
    await firestore.collection(COL.sessions).doc(token).delete();
    return;
  }
  const db = await readDb();
  db.sessions = db.sessions.filter((s) => s.token !== token);
  await writeDb(db);
}
