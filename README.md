# Projektweb-Tool

Generator für **Neubau-Projektwebseiten** aus Google-Sheets-/Excel-Projektdaten – inkl. eigenem **Admin-Bereich pro Projekt** mit Live-Vorschau und Entwurf-/Live-Trennung (Draft → Publish).

> Status: **lauffähiger MVP** mit 1 Template (`Modern / Hochwertig`) und dem Beispielprojekt *Wohnen in der Südstadt*. Erweiterbar auf weitere Templates und Live-Google-Sheets-Anbindung.

### Neu (v0.2)
- **Seite 1:1 nachgebaut** (seniorengerecht): Hero, Das Projekt (Slider), Besonderheiten, **Wohnungsfinder** (klickbares Gebäude → Geschoss → Grundriss + Preistabelle), **Virtueller Rundgang / Musterwohnung** (Slider + optionaler 360°-Embed), Innenraum-Slider, Lage (Bild + Karte), Ablauf, FAQ, Footer mit PlanVision3D-Credit.
- **Projekte löschen** mit Bestätigung (Dashboard ⋯-Menü + im Editor).
- **Leads**: Kontaktformular speichert Anfragen in der DB; eigene Leads-Ansicht je Projekt (`/projects/<id>/leads`) mit Status.
- **Kundenbereich**: Admin legt unter `/kunden` Kunden an (E-Mail + Passwort) und weist Projekte per ⋯-Menü zu. Kunden melden sich unter `/kunde/login` an und sehen unter `/kunde` **nur ihre** Projekte + Anfragen. Passwörter scrypt-gehasht, Session per httpOnly-Cookie, Zugriffsschutz serverseitig.
  - Demo-Login: **mueller@example.de** / **test-1234**

### Routen-Übersicht
| Bereich | Route |
|---|---|
| Admin-Dashboard | `/` |
| Projekt anlegen | `/projects/new` |
| Editor (Admin) | `/projects/<id>` |
| Leads (Admin) | `/projects/<id>/leads` |
| Kundenverwaltung | `/kunden` |
| Live-Seite | `/site/<slug>` |
| Kunden-Login | `/kunde/login` |
| Kunden-Dashboard | `/kunde` |

---

## Schnellstart

```bash
cd projektweb-tool
npm install
npm run dev          # http://localhost:4000
npm run seed         # legt das Beispielprojekt "Wohnen in der Südstadt" an (Dev-Server muss laufen)
```

- **Dashboard / Projektliste:** http://localhost:4000
- **Neues Projekt:** http://localhost:4000/projects/new
- **Admin (Beispiel):** wird beim Seed ausgegeben → `/projects/<id>`
- **Live-Seite:** `/site/wohnen-in-der-suedstadt`

---

## 1) Technische Architektur

```
                ┌──────────────────────────────────────────────┐
   Typeform ──► │  (bereits vorhanden) Make.com → Google Sheet  │
                └──────────────────────────────────────────────┘
                                   │  Export als .xlsx / .csv
                                   ▼
        ┌──────────────────────────────────────────────────────────────┐
        │                    PROJEKTWEB-TOOL (Next.js)                   │
        │                                                                │
        │  Import-Layer        Persistenz          Render-Layer          │
        │  parseXlsx.ts   ─►   JSON-Store (db.ts)   Template-Registry     │
        │  (Sheets → Model)    draft + published    Modern / Natural / …  │
        │        │                  │                      │             │
        │        ▼                  ▼                      ▼             │
        │   Admin-UI (React)   API-Routes (/api/*)   /preview  /site     │
        │   links Editor /     create·save·publish   (Entwurf) (Live)    │
        │   rechts Vorschau    upload·import                             │
        └──────────────────────────────────────────────────────────────┘
```

**Komponenten**

| Schicht | Aufgabe | Datei(en) |
|---|---|---|
| Import | Excel/Sheets → `ProjectContent` mappen, fehlende Daten markieren | `src/lib/sheets/parseXlsx.ts` |
| Persistenz | Projekte speichern/laden (Repository-Pattern) | `src/lib/db.ts` |
| Datenmodell | Typsicheres Schema für die ganze Website | `src/types/content.ts` |
| Templates | austauschbare Designs, gemeinsames Datenmodell | `src/templates/` |
| Admin | bearbeiten, Vorschau, speichern, veröffentlichen | `src/components/admin/` |
| API | REST-Endpunkte für alle Aktionen | `src/app/api/` |
| Rendering | Entwurfs-Vorschau & veröffentlichte Live-Seite | `src/app/preview`, `src/app/site` |

**Bewusste MVP-Entscheidungen**

- **JSON-Store statt DB-Server:** läuft sofort ohne Setup. Die gesamte App spricht nur über `src/lib/db.ts` mit den Daten → für Produktion 1:1 gegen **Prisma + Postgres** austauschbar, ohne den Rest anzufassen.
- **Eigenständige Seiten:** Nach dem Import sind die Webseiten **nicht** mehr von Google Sheets abhängig (löst die bisherige Live-`gviz`-Abhängigkeit aus WordPress ab). Wohnungen/Preise/Status werden im Admin gepflegt.
- **Draft/Publish:** Jedes Projekt hält zwei Snapshots (`draft`, `published`). Änderungen landen erst nach „Veröffentlichen“ auf der Live-Seite.

---

## 2) Datenmodell

Vollständig in `src/types/content.ts`. Kern:

- `Project` = Hülle: `id, slug, name, createdAt, publishedAt, draft, published, warnings`
- `ProjectContent` = die komplette Website, unterteilt in **Datenbereiche**:
  - `branding` (Primär-/Sekundärfarbe, Logo, Font)
  - `hero` (Label, Überschriften, CTA, Bild, Fakten-Kacheln)
  - `intro` (Projektübersicht, Absätze, Eckdaten)
  - `usps` (Alleinstellungsmerkmale)
  - `features` (Besonderheiten / Highlights)
  - `location` (Adresse, Beschreibung, Vorteile, Karte)
  - `gallery` (Visualisierungen)
  - `floorplans` (Grundrisse)
  - `units` (Wohneinheiten: Fläche, Zimmer, Preis, Verfügbarkeit, Status, Grundriss)
  - `process` (Ablauf)
  - `faq`
  - `contact` (Ansprechpartner, Empfänger-Mails, Formularfelder)
  - `seo`
  - `legal` (Impressum)
- `DataWarning` markiert fehlende/unklare Felder aus dem Import.

---

## 3) MVP-Plan & Roadmap

**MVP (umgesetzt ✅)**
1. Projekt anlegen (Name + xlsx-Upload)
2. xlsx automatisch auslesen → strukturiert speichern → fehlende Daten markieren
3. 1 Template (`Modern`) generiert die Website automatisch
4. Admin pro Projekt: links Felder bearbeiten, rechts Live-Vorschau
5. Speichern (Entwurf) und Veröffentlichen (Live) getrennt
6. Bild-Upload/-Austausch, Wohnungen/Preise/Status, Ansprechpartner, Highlights bearbeiten
7. Live-Seite unter eigenem Slug

**Nächste Schritte (vorbereitet, noch offen)**
- Templates `Natural` und `Minimal` ausbauen (Registry + Datenmodell stehen bereits)
- Live-Google-Sheets-Anbindung (Link verbinden statt Upload)
- Lead-Formular real versenden (E-Mail/Sheet-Append) statt Demo-Alert
- Auth/Login + Mandanten (Kunde sieht nur sein Projekt)
- Export/Deploy nach WordPress bzw. statischer Export
- Grundriss-Zuordnung pro Wohneinheit (Bilder liegen im Ordner bereit)

---

## 4) Ordner- & Komponentenstruktur

```
projektweb-tool/
├─ src/
│  ├─ types/content.ts              # Datenmodell (Single Source of Truth)
│  ├─ lib/
│  │  ├─ db.ts                      # Persistenz (Repository, JSON-Store)
│  │  ├─ defaults.ts                # leeres Grundgerüst + Standard-Formular
│  │  └─ sheets/parseXlsx.ts        # Import: Sheets/Excel → ProjectContent
│  ├─ templates/
│  │  ├─ registry.tsx               # Template-Liste (neues Template = 1 Eintrag)
│  │  └─ modern/                    # Template "Modern" (Component + CSS-Module)
│  ├─ components/
│  │  ├─ TopBar.tsx
│  │  └─ admin/
│  │     ├─ AdminEditor.tsx         # linke Felder + rechte Vorschau + Save/Publish
│  │     └─ fields.tsx              # wiederverwendbare Formular-Bausteine
│  └─ app/
│     ├─ page.tsx                   # Dashboard / Projektliste
│     ├─ projects/new/page.tsx      # Projekt anlegen
│     ├─ projects/[id]/page.tsx     # Admin-Bereich
│     ├─ preview/[id]/page.tsx      # Entwurfs-Vorschau (iframe)
│     ├─ site/[slug]/page.tsx       # veröffentlichte Live-Seite
│     └─ api/projects/...           # REST-Endpunkte
├─ scripts/seed.mjs                 # Beispielprojekt anlegen
├─ data/db.json                     # (Laufzeit) gespeicherte Projekte
└─ public/uploads/<projectId>/      # (Laufzeit) hochgeladene Bilder
```

---

## 5) Admin-Dashboard-Struktur

Zweispaltig (`src/components/admin/AdminEditor.tsx`):

- **Links – bearbeitbare Daten** in aufklappbaren Sektionen:
  ① Projektdaten & Branding · ② Hero · ③ Projektübersicht · ④ USPs · ⑤ Besonderheiten ·
  ⑥ Wohnungen/Preise/Status · ⑦ Galerie · ⑧ Lage · ⑨ Ablauf · ⑩ FAQ · ⑪ Ansprechpartner · ⑫ SEO & Impressum
- **Rechts – Live-Vorschau** (iframe auf `/preview/[id]`, zeigt den Entwurf)
- **Unten – Aktionsleiste:** „Ungespeicherte Änderungen“-Status, **Speichern** (Entwurf), **Veröffentlichen** (Live)
- **Oben rechts:** Vorschau aktualisieren, „Live-Seite öffnen“
- Fehlende/unklare Importdaten werden oben als Warn-Box gelistet.

---

## 6) Website-Templates (2–3)

In `src/templates/registry.tsx` registriert:

1. **Modern / Hochwertig** ✅ *(gebaut)* – großer Bild-Hero, Fakten-Kacheln, kräftige Akzentfarbe.
2. **Natürlich / Elegant** *(vorbereitet)* – warme Erd-/Grüntöne, viel Weißraum, serifenbetont.
3. **Minimalistisch / Urban** *(vorbereitet)* – reduziert, schwarz-weiß + 1 Akzent, große Typografie.

Alle Templates rendern **dasselbe Datenmodell** → Template-Wechsel im Admin ohne Datenverlust. Ein neues Template hinzufügen = Komponente bauen + 1 Eintrag in der Registry.
