/**
 * ZENTRALES DATENMODELL
 * ----------------------
 * Eine `ProjectContent` beschreibt eine komplette Projektwebseite – unabhängig
 * vom gewählten Template. Jedes Template rendert dieselbe Struktur, nur anders.
 *
 * Pro Projekt werden zwei Snapshots dieser Struktur gehalten:
 *   - draft     (Entwurf, im Admin bearbeitbar, in der Vorschau sichtbar)
 *   - published (Live-Version, erst nach "Veröffentlichen" überschrieben)
 *
 * Erweiterbar: neue Felder einfach ergänzen; Templates greifen nur auf das zu,
 * was sie brauchen. Optionale Felder bleiben abwärtskompatibel.
 */

export type TemplateId = "modern" | "natural" | "minimal";

export type FieldStatus = "ok" | "missing" | "unclear";

/** Markiert fehlende/unklare Daten aus dem Import (Anforderung: "Daten markieren"). */
export interface DataWarning {
  /** Pfad im Content-Objekt, z.B. "hero.headline" */
  path: string;
  /** Menschlich lesbares Label */
  label: string;
  level: "missing" | "unclear";
  message: string;
}

export interface MediaImage {
  url: string;
  alt?: string;
  caption?: string;
}

export interface Fact {
  icon?: string;
  label: string;
  value?: string;
}

export interface Feature {
  icon?: string; // optionales Emoji (Fallback)
  iconKey?: string; // Schlüssel aus der Icon-Bibliothek (bevorzugt)
  title: string;
  text: string;
}

export interface Usp {
  title: string;
  text: string;
  image?: MediaImage;
}

export interface LocationAdvantage {
  icon?: string;
  iconKey?: string;
  text: string;
}

export interface ProcessStep {
  title: string;
  description: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ContactPerson {
  name: string;
  phone?: string;
  email?: string;
}

export type FormFieldType = "select" | "text" | "tel" | "email" | "checkbox";

export interface FormField {
  key: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  options?: string[];
}

export interface Unit {
  id: string;
  name: string; // "WE 01"
  floor: string; // "Erdgeschoss"
  area: string; // "ca. 80 m²"
  rooms: string; // "2-Zimmer"
  price: number | null; // Kaltmiete in EUR
  priceLabel?: string; // optionaler Freitext statt Zahl
  extra: string; // "Carport" / "auf Anfrage"
  status: "verfuegbar" | "reserviert" | "vermietet" | "verkauft";
  floorplan?: MediaImage;
}

/** Grundriss pro Geschoss für den Wohnungsfinder. */
export interface FloorPlan {
  floor: string;
  image: MediaImage;
}

/* --------- Interaktiver Wohnungsnavigator (Polygon-Hotspots) --------- */
export interface NavPoint { x: number; y: number } // 0–100 % der Artboard-Fläche
export interface NavZone {
  id: string;
  title: string;
  tooltip?: string;
  target?: string; // Artboard-ID bei Klick
  points?: NavPoint[]; // Polygon in Artboard-%
  isBack?: boolean;
}
export interface NavArtboard {
  id: string;
  title: string;
  image: MediaImage;
  width: number;
  height: number;
  zones: NavZone[];
  backTarget?: string; // Ziel des Zurück-Buttons
}
export interface FloorNavigator {
  rootId: string;
  artboards: NavArtboard[];
}

/* ----------------------------- Sektionen ----------------------------- */

export interface BrandingData {
  primaryColor: string; // Blau – Überschriften/Akzente
  secondaryColor: string; // Gold – "Termin vereinbaren"
  ctaColor?: string; // Grün – "Jetzt anfragen!"
  badgeColor?: string; // Terrakotta – Section-Badges
  logoUrl?: string;
  agencyLogoUrl?: string; // Logo/Stempel der umsetzenden Agentur (Technische Umsetzung)
  font?: string;
}

export interface HeroData {
  label?: string;
  headline: string;
  subheadline?: string;
  shortDescription?: string;
  ctaText: string;
  image?: MediaImage;
  facts: Fact[];
}

export interface IntroData {
  eyebrow?: string;
  projectName: string;
  paragraphs: string[];
  facts: Fact[]; // Objektart, Adresse, Baustart, Bezugsfertig, Energie ...
  images: MediaImage[]; // Außenvisualisierungen im Abschnitt "Das Projekt"
}

export interface VirtualTourData {
  heading: string; // "Virtueller Rundgang"
  subheading?: string; // "Musterwohnung"
  description?: string;
  embedUrl?: string; // 360°/Matterport iframe-URL
  images: MediaImage[]; // Innenraum-Visualisierungen der Musterwohnung
}

export interface LocationData {
  address: string;
  description?: string;
  advantages: LocationAdvantage[];
  mapEmbedUrl?: string;
  image?: MediaImage; // Standort-/Umgebungsbild (z.B. Schlossgarten)
}

export interface UnitsData {
  /** geordnete Geschoss-Reihenfolge für Tabs/Filter */
  floors: string[];
  items: Unit[];
  note?: string; // z.B. Stellplatz-Preise
  intro?: string; // Beschreibungstext über dem Wohnungsfinder
  finderHint?: string; // "Bitte wählen Sie ein Geschoss …"
  buildingImage?: MediaImage; // Gebäude-Visualisierung für den klickbaren Finder
  floorPlans: FloorPlan[]; // Grundriss je Geschoss
  navigator?: FloorNavigator; // interaktiver Polygon-Wohnungsnavigator
}

export interface ContactData {
  persons: ContactPerson[];
  website?: string;
  recipientEmails: string[];
  formFields: FormField[];
}

export interface SeoData {
  title: string;
  description: string;
}

export interface LegalData {
  companyName: string;
  street: string;
  cityZip: string;
  representedBy?: string;
  phone?: string;
  email?: string;
  registerNumber?: string;
  registerCourt?: string;
  vatId?: string;
  impressumText?: string;
}

/* --------------------------- Gesamtmodell --------------------------- */

export interface ProjectContent {
  schemaVersion: 1;
  template: TemplateId;
  branding: BrandingData;
  hero: HeroData;
  intro: IntroData;
  usps: Usp[];
  features: Feature[];
  units: UnitsData;
  virtualTour: VirtualTourData;
  location: LocationData;
  gallery: MediaImage[]; // Innenraum-Visualisierungen
  floorplans: MediaImage[]; // Etagengrundrisse
  process: ProcessStep[];
  faq: FaqItem[];
  contact: ContactData;
  seo: SeoData;
  legal: LegalData;
}

/* --------------------------- Projekt-Hülle --------------------------- */

export interface Project {
  id: string;
  slug: string; // URL der Live-Seite: /site/<slug>
  name: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  /** Bearbeitbarer Entwurf */
  draft: ProjectContent;
  /** Veröffentlichte Live-Version (null = noch nie veröffentlicht) */
  published: ProjectContent | null;
  /** Beim Import erkannte fehlende/unklare Daten */
  warnings: DataWarning[];
  /** E-Mails der zugewiesenen Kunden (Kundenbereich sieht nur eigene Projekte) */
  assignedCustomerEmails: string[];
  /** Google-Sheet-ID, in der die Leads zusätzlich landen (aus Vorlage) */
  leadsSheetId?: string;
}

/** Vom Admin angelegter Kunde mit Zugang zum Kundenbereich. */
export interface Customer {
  id: string;
  name: string;
  email: string; // Login + Verknüpfung zu Projekten (assignedCustomerEmail)
  passwordHash: string; // scrypt: "salt:hash"
  createdAt: string;
}

/** Login-Sitzung eines Kunden (Cookie-Token). */
export interface Session {
  token: string;
  customerId: string;
  createdAt: string;
  expiresAt: string;
}

export type LeadStatus = "neu" | "kontaktiert" | "abgeschlossen";

/** Eine über das Kontaktformular eingegangene Anfrage. */
export interface Lead {
  id: string;
  projectId: string;
  createdAt: string;
  status: LeadStatus;
  /** Antworten nach Formularfeld-Label */
  data: Record<string, string>;
}
