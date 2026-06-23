import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Project, Lead, LeadStatus, Customer, Session } from "@/types/content";

/**
 * PERSISTENZ-SCHICHT (Repository-Pattern)
 * ---------------------------------------
 * MVP: einfacher JSON-Store auf Platte (data/db.json) – keine externe DB nötig,
 * läuft sofort. Die gesamte App spricht NUR über die unten exportierten
 * Funktionen mit den Daten. Für Produktion tauscht man die Implementierung
 * (z.B. Prisma + Postgres) aus, ohne die übrige App anzufassen.
 */

const DB_PATH = path.join(process.cwd(), "data", "db.json");

interface DbShape {
  projects: Project[];
  leads: Lead[];
  customers: Customer[];
  sessions: Session[];
}

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

/** Füllt fehlende (neue) Felder älterer Projekte mit Defaults – Schema-Migration zur Laufzeit. */
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
  // Migration: Einzel-E-Mail -> Liste
  const legacy = (p as any).assignedCustomerEmail;
  if (!Array.isArray(p.assignedCustomerEmails)) p.assignedCustomerEmails = legacy ? [legacy] : [];
  delete (p as any).assignedCustomerEmail;
  return p;
}

async function writeDb(db: DbShape): Promise<void> {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

export async function listProjects(): Promise<Project[]> {
  const db = await readDb();
  return db.projects.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export async function getProject(id: string): Promise<Project | null> {
  const db = await readDb();
  return db.projects.find((p) => p.id === id) ?? null;
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const db = await readDb();
  return db.projects.find((p) => p.slug === slug) ?? null;
}

export async function saveProject(project: Project): Promise<Project> {
  const db = await readDb();
  const idx = db.projects.findIndex((p) => p.id === project.id);
  project.updatedAt = new Date().toISOString();
  if (idx >= 0) db.projects[idx] = project;
  else db.projects.push(project);
  await writeDb(db);
  return project;
}

export async function deleteProject(id: string): Promise<void> {
  const db = await readDb();
  db.projects = db.projects.filter((p) => p.id !== id);
  db.leads = db.leads.filter((l) => l.projectId !== id); // Leads mitlöschen
  await writeDb(db);
}

/* ------------------------------- Leads ------------------------------- */

export async function addLead(projectId: string, data: Record<string, string>): Promise<Lead> {
  const db = await readDb();
  const lead: Lead = { id: randomUUID(), projectId, createdAt: new Date().toISOString(), status: "neu", data };
  db.leads.push(lead);
  await writeDb(db);
  return lead;
}

export async function listLeads(projectId: string): Promise<Lead[]> {
  const db = await readDb();
  return db.leads.filter((l) => l.projectId === projectId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function countLeads(projectId: string): Promise<number> {
  const db = await readDb();
  return db.leads.filter((l) => l.projectId === projectId).length;
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<void> {
  const db = await readDb();
  const lead = db.leads.find((l) => l.id === id);
  if (lead) { lead.status = status; await writeDb(db); }
}

/* ----------------------------- Kunden ----------------------------- */

export async function listCustomers(): Promise<Customer[]> {
  const db = await readDb();
  return db.customers.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
export async function getCustomer(id: string): Promise<Customer | null> {
  const db = await readDb();
  return db.customers.find((c) => c.id === id) ?? null;
}
export async function getCustomerByEmail(email: string): Promise<Customer | null> {
  const db = await readDb();
  const e = email.toLowerCase().trim();
  return db.customers.find((c) => c.email === e) ?? null;
}
export async function saveCustomer(customer: Customer): Promise<Customer> {
  const db = await readDb();
  const idx = db.customers.findIndex((c) => c.id === customer.id);
  if (idx >= 0) db.customers[idx] = customer;
  else db.customers.push(customer);
  await writeDb(db);
  return customer;
}
export async function deleteCustomer(id: string): Promise<void> {
  const db = await readDb();
  const cust = db.customers.find((c) => c.id === id);
  db.customers = db.customers.filter((c) => c.id !== id);
  db.sessions = db.sessions.filter((s) => s.customerId !== id);
  // Projektzuweisung lösen
  if (cust) db.projects.forEach((p) => { p.assignedCustomerEmails = (p.assignedCustomerEmails || []).filter((e) => e !== cust.email); });
  await writeDb(db);
}
/** Projekte eines Kunden (per zugewiesener E-Mail). */
export async function projectsForCustomer(email: string): Promise<Project[]> {
  const db = await readDb();
  const e = email.toLowerCase().trim();
  return db.projects.map(normalizeProject).filter((p) => p.assignedCustomerEmails.includes(e));
}
/** Prüft, ob ein Kunde Zugriff auf ein Projekt hat. */
export async function customerHasAccess(email: string, projectId: string): Promise<boolean> {
  const p = await getProject(projectId);
  return !!p && p.assignedCustomerEmails.includes(email.toLowerCase().trim());
}

/* ---------------------------- Sessions ---------------------------- */

export async function createSession(customerId: string): Promise<Session> {
  const db = await readDb();
  const token = randomUUID() + randomUUID().replace(/-/g, "");
  const now = Date.now();
  const session: Session = {
    token, customerId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 Tage
  };
  db.sessions.push(session);
  await writeDb(db);
  return session;
}
export async function getSessionCustomer(token: string | undefined): Promise<Customer | null> {
  if (!token) return null;
  const db = await readDb();
  const s = db.sessions.find((x) => x.token === token);
  if (!s || new Date(s.expiresAt).getTime() < Date.now()) return null;
  return db.customers.find((c) => c.id === s.customerId) ?? null;
}
export async function deleteSession(token: string | undefined): Promise<void> {
  if (!token) return;
  const db = await readDb();
  db.sessions = db.sessions.filter((s) => s.token !== token);
  await writeDb(db);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
