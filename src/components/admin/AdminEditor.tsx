"use client";
import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import type { Project, ProjectContent, Unit } from "@/types/content";
import { TEMPLATES } from "@/templates/registry";
import { Text, Area, Color, Select, Section, ImageField, RowActions } from "./fields";
import Icon, { ICON_OPTIONS, FEATURE_PRESETS } from "@/templates/modern/icons";
import {
  ArrowLeft, ChevronRight, Inbox, Download, Trash2, RefreshCw, ExternalLink, Check, AlertTriangle,
  Building2, Image as ImageIcon, FileText, Award, Sparkles, Table, Images, View,
  MapPin, ListChecks, HelpCircle, Contact, Search,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "verfuegbar", label: "Verfügbar" },
  { value: "reserviert", label: "Reserviert" },
  { value: "vermietet", label: "Vermietet" },
  { value: "verkauft", label: "Verkauft" },
];

export default function AdminEditor({ project, canDelete = true, canExport = true, backHref = "/", leadsHref }: { project: Project; canDelete?: boolean; canExport?: boolean; backHref?: string; leadsHref?: string }) {
  const leadsLink = leadsHref ?? `/projects/${project.id}/leads`;
  const [draft, setDraft] = useState<ProjectContent>(project.draft);
  const [name, setName] = useState(project.name);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState("");
  const [previewKey, setPreviewKey] = useState(0);
  const [published, setPublished] = useState(!!project.published);
  const [panelW, setPanelW] = useState(520);
  const [resizing, setResizing] = useState(false);
  const asideRef = useRef<HTMLElement>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportHtml, setExportHtml] = useState("");
  const [exportBusy, setExportBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  // Linke Editor-Leiste flüssig per Ziehen verbreitern (kein Rerender pro Pixel,
  // Overlay verhindert, dass das Vorschau-iframe die Maus abfängt).
  function startResize(e: React.MouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = asideRef.current?.offsetWidth ?? panelW;
    let latest = startW;
    setResizing(true);
    const onMove = (ev: MouseEvent) => {
      latest = Math.min(Math.max(startW + (ev.clientX - startX), 360), Math.min(window.innerWidth - 320, 1200));
      if (asideRef.current) asideRef.current.style.width = `${latest}px`;
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      setResizing(false);
      setPanelW(latest);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  const patch = useCallback((fn: (d: ProjectContent) => void) => {
    setDraft((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
    setDirty(true);
  }, []);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2600); };

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft, name }),
    });
    setSaving(false);
    if (res.ok) { setDirty(false); setPreviewKey((k) => k + 1); flash("Entwurf gespeichert."); }
    else flash("Fehler beim Speichern.");
  }

  async function removeProject() {
    if (!confirm(`Projekt „${name}“ wirklich unwiderruflich löschen? Alle Daten, Bilder und Leads gehen verloren.`)) return;
    const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    if (res.ok) window.location.href = "/";
    else flash("Fehler beim Löschen.");
  }

  async function openExport() {
    setExportOpen(true);
    setExportBusy(true);
    setCopied(false);
    setExportHtml("");
    try {
      const res = await fetch(`/api/projects/${project.id}/export`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || "Export fehlgeschlagen.");
      setExportHtml(text);
    } catch (err: any) {
      setExportHtml("");
      flash(err.message || "Export fehlgeschlagen.");
    } finally {
      setExportBusy(false);
    }
  }

  async function copyExport() {
    try {
      await navigator.clipboard.writeText(exportHtml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      flash("Kopieren nicht möglich – bitte manuell markieren.");
    }
  }

  function downloadExport() {
    const blob = new Blob([exportHtml], { type: "text/html;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${project.slug || "projekt"}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function publish() {
    setPublishing(true);
    await fetch(`/api/projects/${project.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft, name }),
    });
    const res = await fetch(`/api/projects/${project.id}/publish`, { method: "POST" });
    setPublishing(false);
    if (res.ok) { setDirty(false); setPublished(true); setPreviewKey((k) => k + 1); flash("Veröffentlicht! Die Live-Seite ist aktualisiert."); }
    else flash("Fehler beim Veröffentlichen.");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      {resizing && <div style={{ position: "fixed", inset: 0, zIndex: 9999, cursor: "col-resize" }} />}

      {/* EINHEITLICHE TOPBAR (über beide Bereiche) */}
      <header style={{ height: 60, flexShrink: 0, display: "flex", alignItems: "center", gap: 12, padding: "0 22px", background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
        <Link href={backHref} className="muted" style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", fontSize: ".88rem", flexShrink: 0 }}>
          <ArrowLeft size={16} /> Projekte
        </Link>
        <ChevronRight size={15} style={{ color: "var(--muted-foreground)", opacity: .45, flexShrink: 0 }} />
        <strong style={{ fontFamily: "Poppins", fontSize: "1rem", color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 280 }}>{name}</strong>
        {published ? <span className="pill pill-live">Live</span> : <span className="pill pill-draft">Entwurf</span>}

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 9 }}>
          <span className="muted" style={{ fontSize: ".8rem", display: "inline-flex", alignItems: "center", gap: 7, marginRight: 2 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: dirty ? "var(--warning)" : "var(--success)", flexShrink: 0 }} />
            {dirty ? "Ungespeichert" : "Gespeichert"}
          </span>
          <Link href={leadsLink} className="btn btn-ghost btn-sm"><Inbox size={15} /> Leads</Link>
          {canExport && <button onClick={openExport} className="btn btn-ghost btn-sm" title="Als HTML für WordPress / Elementor exportieren"><Download size={15} /> Export</button>}
          {canDelete && <button onClick={removeProject} className="btn btn-danger btn-sm" title="Projekt löschen"><Trash2 size={15} /></button>}
          <span style={{ width: 1, height: 26, background: "var(--border)", margin: "0 3px" }} />
          <button className="btn btn-ghost btn-sm" onClick={save} disabled={saving || !dirty}>{saving ? "Speichert…" : "Speichern"}</button>
          <button className="btn btn-primary btn-sm" onClick={publish} disabled={publishing}>{publishing ? "Veröffentlicht…" : "Veröffentlichen"}</button>
        </div>
      </header>

      {/* KÖRPER: Editor + Vorschau */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
      <aside ref={asideRef} style={{ width: panelW, flexShrink: 0, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", background: "var(--tool-soft)" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 28px" }}>
          {project.warnings.length > 0 && (
            <div className="warn-box">
              <h4 style={{ display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={15} /> {project.warnings.length} Datenpunkte prüfen</h4>
              <ul>{project.warnings.map((w, i) => <li key={i}>{w.label}: {w.message}</li>)}</ul>
            </div>
          )}

          <Group label="Branding" first>
          {/* Projektdaten / Branding */}
          <Section title="Projektdaten & Branding" icon={<Building2 size={16} />} defaultOpen>
            <Text label="Projektname (intern)" value={name} onChange={(v) => { setName(v); setDirty(true); }} />
            <Select label="Template" value={draft.template}
              options={TEMPLATES.map((t) => ({ value: t.id, label: t.available ? t.name : `${t.name} (bald)` }))}
              onChange={(v) => patch((d) => { if (TEMPLATES.find((t) => t.id === v)?.available) d.template = v as any; })} />
            <Color label="Primärfarbe" value={draft.branding.primaryColor} onChange={(v) => patch((d) => { d.branding.primaryColor = v; })} />
            <Color label="Sekundärfarbe" value={draft.branding.secondaryColor} onChange={(v) => patch((d) => { d.branding.secondaryColor = v; })} />
            <ImageField label="Logo (optional)" url={draft.branding.logoUrl} projectId={project.id} onChange={(url) => patch((d) => { d.branding.logoUrl = url; })} />
          </Section>

          </Group>

          <Group label="Hauptbereiche">
          {/* Hero */}
          <Section title="Hero-Bereich" icon={<ImageIcon size={16} />}>
            <ImageField label="Hauptbild" url={draft.hero.image?.url} projectId={project.id} onChange={(url) => patch((d) => { d.hero.image = { url }; })} />
            <Text label="Label / Badge" value={draft.hero.label || ""} onChange={(v) => patch((d) => { d.hero.label = v; })} />
            <Text label="Hauptüberschrift" value={draft.hero.headline} onChange={(v) => patch((d) => { d.hero.headline = v; })} />
            <Text label="Unterüberschrift" value={draft.hero.subheadline || ""} onChange={(v) => patch((d) => { d.hero.subheadline = v; })} />
            <Area label="Kurzbeschreibung" value={draft.hero.shortDescription || ""} onChange={(v) => patch((d) => { d.hero.shortDescription = v; })} />
            <Text label="Button-Text" value={draft.hero.ctaText} onChange={(v) => patch((d) => { d.hero.ctaText = v; })} />
            <ListEditor label="Fakten-Kacheln" items={draft.hero.facts}
              onAdd={() => patch((d) => { d.hero.facts.push({ label: "" }); })}
              onRemove={(i) => patch((d) => { d.hero.facts.splice(i, 1); })}
              render={(f, i) => <Text label={`Kachel ${i + 1}`} value={f.label} onChange={(v) => patch((d) => { d.hero.facts[i].label = v; })} />} />
          </Section>

          {/* Intro */}
          <Section title="Projektübersicht" icon={<FileText size={16} />}>
            <Text label="Projektname (Anzeige)" value={draft.intro.projectName} onChange={(v) => patch((d) => { d.intro.projectName = v; })} />
            <ListEditor label="Textabsätze" items={draft.intro.paragraphs}
              onAdd={() => patch((d) => { d.intro.paragraphs.push(""); })}
              onRemove={(i) => patch((d) => { d.intro.paragraphs.splice(i, 1); })}
              render={(p, i) => <Area label={`Absatz ${i + 1}`} value={p} onChange={(v) => patch((d) => { d.intro.paragraphs[i] = v; })} />} />
            <ListEditor label="Eckdaten (Label/Wert)" items={draft.intro.facts}
              onAdd={() => patch((d) => { d.intro.facts.push({ label: "", value: "" }); })}
              onRemove={(i) => patch((d) => { d.intro.facts.splice(i, 1); })}
              render={(f, i) => (<div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}><Text label="Label" value={f.label} onChange={(v) => patch((d) => { d.intro.facts[i].label = v; })} /></div>
                <div style={{ flex: 1 }}><Text label="Wert" value={f.value || ""} onChange={(v) => patch((d) => { d.intro.facts[i].value = v; })} /></div>
              </div>)} />
            <ListEditor label="Projekt-Bilder (Slider)" items={draft.intro.images}
              onAdd={() => patch((d) => { d.intro.images.push({ url: "" }); })}
              onRemove={(i) => patch((d) => { d.intro.images.splice(i, 1); })}
              render={(g, i) => (<>
                <ImageField label={`Bild ${i + 1}`} url={g.url} projectId={project.id} onChange={(url) => patch((d) => { d.intro.images[i].url = url; })} />
                <Text label="Bildunterschrift" value={g.caption || ""} onChange={(v) => patch((d) => { d.intro.images[i].caption = v; })} />
              </>)} />
          </Section>

          {/* USPs */}
          <Section title="Alleinstellungsmerkmale" icon={<Award size={16} />}>
            <ListEditor label="USP-Karten" items={draft.usps}
              onAdd={() => patch((d) => { d.usps.push({ title: "", text: "" }); })}
              onRemove={(i) => patch((d) => { d.usps.splice(i, 1); })}
              render={(u, i) => (<>
                <ImageField label="Bild" url={u.image?.url} projectId={project.id} onChange={(url) => patch((d) => { d.usps[i].image = { url }; })} />
                <Text label="Überschrift" value={u.title} onChange={(v) => patch((d) => { d.usps[i].title = v; })} />
                <Area label="Text" value={u.text} onChange={(v) => patch((d) => { d.usps[i].text = v; })} />
              </>)} />
          </Section>

          {/* Features */}
          <Section title="Besonderheiten / Highlights" icon={<Sparkles size={16} />} badge={`${draft.features.length}`}>
            <label className="field">
              <span>Vorlage einfügen</span>
              <select value="" onChange={(e) => { const p = FEATURE_PRESETS.find((x) => x.title === e.target.value); if (p) patch((d) => { d.features.push({ title: p.title, text: p.text, iconKey: p.iconKey }); }); }}>
                <option value="">+ Häufige Besonderheit wählen…</option>
                {FEATURE_PRESETS.map((p) => <option key={p.title} value={p.title}>{p.title}</option>)}
              </select>
            </label>
            <ListEditor label="Highlights" items={draft.features}
              onAdd={() => patch((d) => { d.features.push({ iconKey: "home", title: "", text: "" }); })}
              onRemove={(i) => patch((d) => { d.features.splice(i, 1); })}
              render={(f, i) => (<>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                  <div style={{ width: 44, height: 40, borderRadius: 8, background: "var(--tool-accent)", color: "#fff", display: "grid", placeItems: "center", fontSize: "1.3rem", flexShrink: 0 }}>
                    <Icon name={f.iconKey} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Select label="Icon" value={f.iconKey || ""} options={[{ value: "", label: "– kein –" }, ...ICON_OPTIONS.map((o) => ({ value: o.key, label: o.label }))]} onChange={(v) => patch((d) => { d.features[i].iconKey = v; })} />
                  </div>
                </div>
                <Text label="Titel" value={f.title} onChange={(v) => patch((d) => { d.features[i].title = v; })} />
                <Area label="Text" value={f.text} onChange={(v) => patch((d) => { d.features[i].text = v; })} />
              </>)} />
          </Section>

          {/* Units */}
          <Section title="Wohnungen / Preise / Status" icon={<Table size={16} />} badge={`${draft.units.items.length}`}>
            <ImageField label="Gebäude-Bild (klickbarer Wohnungsfinder)" url={draft.units.buildingImage?.url} projectId={project.id} onChange={(url) => patch((d) => { d.units.buildingImage = { url }; })} />
            <Area label="Intro-Text über dem Finder" value={draft.units.intro || ""} onChange={(v) => patch((d) => { d.units.intro = v; })} />
            <ListEditor label="Geschoss-Grundrisse" items={draft.units.floorPlans}
              onAdd={() => patch((d) => { d.units.floorPlans.push({ floor: "", image: { url: "" } }); })}
              onRemove={(i) => patch((d) => { d.units.floorPlans.splice(i, 1); })}
              render={(fp, i) => (<>
                <Text label="Geschoss (exakt wie bei Wohnungen)" value={fp.floor} onChange={(v) => patch((d) => { d.units.floorPlans[i].floor = v; })} />
                <ImageField label="Grundriss-Bild" url={fp.image.url} projectId={project.id} onChange={(url) => patch((d) => { d.units.floorPlans[i].image.url = url; })} />
              </>)} />
            <ListEditor label="Wohneinheiten" items={draft.units.items}
              onAdd={() => patch((d) => { d.units.items.push(newUnit()); })}
              onRemove={(i) => patch((d) => { d.units.items.splice(i, 1); })}
              render={(u, i) => (<>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1 }}><Text label="Bezeichnung" value={u.name} onChange={(v) => patch((d) => { d.units.items[i].name = v; })} /></div>
                  <div style={{ flex: 1 }}><Text label="Geschoss" value={u.floor} onChange={(v) => patch((d) => { d.units.items[i].floor = v; })} /></div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1 }}><Text label="Fläche" value={u.area} onChange={(v) => patch((d) => { d.units.items[i].area = v; })} /></div>
                  <div style={{ flex: 1 }}><Text label="Zimmer" value={u.rooms} onChange={(v) => patch((d) => { d.units.items[i].rooms = v; })} /></div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1 }}><Text label="Mietpreis (€)" type="number" value={u.price?.toString() ?? ""} onChange={(v) => patch((d) => { d.units.items[i].price = v === "" ? null : Number(v); })} /></div>
                  <div style={{ flex: 1 }}><Text label="Besonderheit" value={u.extra} onChange={(v) => patch((d) => { d.units.items[i].extra = v; })} /></div>
                </div>
                <Select label="Status" value={u.status} options={STATUS_OPTIONS} onChange={(v) => patch((d) => { d.units.items[i].status = v as Unit["status"]; })} />
              </>)} />
            <Text label="Hinweis unter der Tabelle" value={draft.units.note || ""} onChange={(v) => patch((d) => { d.units.note = v; })} />
          </Section>

          {/* Gallery */}
          <Section title="Galerie / Visualisierungen" icon={<Images size={16} />} badge={`${draft.gallery.length}`}>
            <ListEditor label="Bilder" items={draft.gallery}
              onAdd={() => patch((d) => { d.gallery.push({ url: "" }); })}
              onRemove={(i) => patch((d) => { d.gallery.splice(i, 1); })}
              render={(g, i) => (<>
                <ImageField label={`Bild ${i + 1}`} url={g.url} projectId={project.id} onChange={(url) => patch((d) => { d.gallery[i].url = url; })} />
                <Text label="Bildunterschrift" value={g.caption || ""} onChange={(v) => patch((d) => { d.gallery[i].caption = v; })} />
              </>)} />
          </Section>

          {/* Virtueller Rundgang */}
          <Section title="Virtueller Rundgang" icon={<View size={16} />} badge={`${draft.virtualTour.images.length}`}>
            <Text label="Überschrift" value={draft.virtualTour.heading} onChange={(v) => patch((d) => { d.virtualTour.heading = v; })} />
            <Text label="Unterüberschrift" value={draft.virtualTour.subheading || ""} onChange={(v) => patch((d) => { d.virtualTour.subheading = v; })} />
            <Text label="360°/Matterport Embed-URL (optional)" value={draft.virtualTour.embedUrl || ""} onChange={(v) => patch((d) => { d.virtualTour.embedUrl = v; })} />
            <ListEditor label="Musterwohnung-Bilder (Slider)" items={draft.virtualTour.images}
              onAdd={() => patch((d) => { d.virtualTour.images.push({ url: "" }); })}
              onRemove={(i) => patch((d) => { d.virtualTour.images.splice(i, 1); })}
              render={(g, i) => (<>
                <ImageField label={`Bild ${i + 1}`} url={g.url} projectId={project.id} onChange={(url) => patch((d) => { d.virtualTour.images[i].url = url; })} />
                <Text label="Bildunterschrift" value={g.caption || ""} onChange={(v) => patch((d) => { d.virtualTour.images[i].caption = v; })} />
              </>)} />
          </Section>

          {/* Location */}
          <Section title="Lage" icon={<MapPin size={16} />}>
            <Text label="Adresse" value={draft.location.address} onChange={(v) => patch((d) => { d.location.address = v; })} />
            <Area label="Standortbeschreibung" value={draft.location.description || ""} onChange={(v) => patch((d) => { d.location.description = v; })} />
            <Text label="Karten-Embed-URL" value={draft.location.mapEmbedUrl || ""} onChange={(v) => patch((d) => { d.location.mapEmbedUrl = v; })} />
            <ListEditor label="Standort-Vorteile" items={draft.location.advantages}
              onAdd={() => patch((d) => { d.location.advantages.push({ icon: "📍", text: "" }); })}
              onRemove={(i) => patch((d) => { d.location.advantages.splice(i, 1); })}
              render={(a, i) => (<div style={{ display: "flex", gap: 8 }}>
                <div style={{ width: 70 }}><Text label="Icon" value={a.icon || ""} onChange={(v) => patch((d) => { d.location.advantages[i].icon = v; })} /></div>
                <div style={{ flex: 1 }}><Text label="Text" value={a.text} onChange={(v) => patch((d) => { d.location.advantages[i].text = v; })} /></div>
              </div>)} />
          </Section>

          </Group>

          <Group label="Weitere Inhalte">
          {/* Process */}
          <Section title="Ablauf" icon={<ListChecks size={16} />}>
            <ListEditor label="Schritte" items={draft.process}
              onAdd={() => patch((d) => { d.process.push({ title: "", description: "" }); })}
              onRemove={(i) => patch((d) => { d.process.splice(i, 1); })}
              render={(p, i) => (<>
                <Text label={`Schritt ${i + 1} – Titel`} value={p.title} onChange={(v) => patch((d) => { d.process[i].title = v; })} />
                <Area label="Beschreibung" value={p.description} onChange={(v) => patch((d) => { d.process[i].description = v; })} />
              </>)} />
          </Section>

          {/* FAQ */}
          <Section title="FAQ" icon={<HelpCircle size={16} />} badge={`${draft.faq.length}`}>
            <ListEditor label="Fragen" items={draft.faq}
              onAdd={() => patch((d) => { d.faq.push({ question: "", answer: "" }); })}
              onRemove={(i) => patch((d) => { d.faq.splice(i, 1); })}
              render={(f, i) => (<>
                <Text label="Frage" value={f.question} onChange={(v) => patch((d) => { d.faq[i].question = v; })} />
                <Area label="Antwort" value={f.answer} onChange={(v) => patch((d) => { d.faq[i].answer = v; })} />
              </>)} />
          </Section>

          {/* Contact */}
          <Section title="Ansprechpartner & Kontakt" icon={<Contact size={16} />}>
            <ListEditor label="Ansprechpartner" items={draft.contact.persons}
              onAdd={() => patch((d) => { d.contact.persons.push({ name: "" }); })}
              onRemove={(i) => patch((d) => { d.contact.persons.splice(i, 1); })}
              render={(c, i) => (<>
                <Text label="Name" value={c.name} onChange={(v) => patch((d) => { d.contact.persons[i].name = v; })} />
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1 }}><Text label="Telefon" value={c.phone || ""} onChange={(v) => patch((d) => { d.contact.persons[i].phone = v; })} /></div>
                  <div style={{ flex: 1 }}><Text label="E-Mail" value={c.email || ""} onChange={(v) => patch((d) => { d.contact.persons[i].email = v; })} /></div>
                </div>
              </>)} />
            <Text label="Webseite" value={draft.contact.website || ""} onChange={(v) => patch((d) => { d.contact.website = v; })} />
            <Text label="Empfänger-E-Mail (Leads)" value={draft.contact.recipientEmails[0] || ""} onChange={(v) => patch((d) => { d.contact.recipientEmails = v ? [v] : []; })} />
          </Section>

          </Group>

          <Group label="SEO & Rechtliches">
          {/* SEO + Legal */}
          <Section title="SEO & Impressum" icon={<Search size={16} />}>
            <Text label="SEO-Titel" value={draft.seo.title} onChange={(v) => patch((d) => { d.seo.title = v; })} />
            <Area label="SEO-Beschreibung" value={draft.seo.description} onChange={(v) => patch((d) => { d.seo.description = v; })} />
            <hr style={{ border: "none", borderTop: "1px solid var(--tool-line)", margin: "12px 0" }} />
            <Text label="Firmenname" value={draft.legal.companyName} onChange={(v) => patch((d) => { d.legal.companyName = v; })} />
            <Text label="Straße" value={draft.legal.street} onChange={(v) => patch((d) => { d.legal.street = v; })} />
            <Text label="PLZ / Ort" value={draft.legal.cityZip} onChange={(v) => patch((d) => { d.legal.cityZip = v; })} />
            <Text label="Vertreten durch" value={draft.legal.representedBy || ""} onChange={(v) => patch((d) => { d.legal.representedBy = v; })} />
            <Text label="USt-IdNr." value={draft.legal.vatId || ""} onChange={(v) => patch((d) => { d.legal.vatId = v; })} />
          </Section>
          </Group>
        </div>
      </aside>

      {/* Resize-Griff */}
      <div onMouseDown={startResize} onDoubleClick={() => setPanelW(520)} title="Ziehen zum Verbreitern (Doppelklick: zurücksetzen)"
        style={{ width: 8, flexShrink: 0, cursor: "col-resize", background: "var(--tool-line)", position: "relative", zIndex: 5 }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 4, height: 44, borderRadius: 4, background: "#9aa3b2" }} />
      </div>

      {/* RECHTS: Live-Vorschau */}
      <main style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", background: "var(--muted)" }}>
        <div style={{ height: 52, flexShrink: 0, display: "flex", alignItems: "center", gap: 12, padding: "0 20px", borderBottom: "1px solid var(--border)", background: "var(--card)" }}>
          <strong style={{ fontFamily: "Poppins", fontSize: ".86rem", color: "var(--foreground)" }}>Live-Vorschau</strong>
          <span className="muted" style={{ fontSize: ".78rem" }}>{dirty ? "Entwurf · ungespeichert" : "Entwurf"}</span>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={() => setPreviewKey((k) => k + 1)}><RefreshCw size={14} /> Aktualisieren</button>
          {published && <Link className="btn btn-gold btn-sm" href={`/site/${project.slug}`} target="_blank">Live-Seite öffnen <ExternalLink size={14} /></Link>}
        </div>
        <iframe key={previewKey} src={`/preview/${project.id}?v=${previewKey}`} style={{ flex: 1, border: "none", width: "100%" }} title="Vorschau" />
      </main>
      </div>

      {exportOpen && (
        <div className="modal-backdrop" onClick={() => setExportOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: "min(720px, 94vw)" }}>
            <h3 style={{ marginTop: 0, fontFamily: "Poppins" }}>Webseite exportieren (HTML)</h3>
            <p className="muted" style={{ marginTop: 4 }}>
              Eigenständiger HTML-Code des aktuellen Entwurfs – zum Einfügen in einen WordPress „Custom HTML"-Block oder ein Elementor „HTML"-Widget. Bilder & Formular verweisen absolut auf diese Anwendung.
            </p>
            <ol className="muted" style={{ fontSize: ".84rem", margin: "10px 0 14px", paddingLeft: 18, lineHeight: 1.6 }}>
              <li>In Elementor: Widget <strong>„HTML"</strong> einfügen (oder WordPress-Block <strong>„Custom HTML"</strong>).</li>
              <li>Code unten <strong>kopieren</strong> und dort einfügen – fertig.</li>
              <li>Tipp: am besten in einen leeren, vollbreiten Abschnitt (full-width, ohne Innenabstand) setzen.</li>
            </ol>

            <textarea
              readOnly
              value={exportBusy ? "Wird erzeugt…" : exportHtml}
              onFocus={(e) => e.currentTarget.select()}
              style={{ width: "100%", height: 220, fontFamily: "monospace", fontSize: ".78rem", whiteSpace: "pre", overflow: "auto" }}
            />

            <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center", flexWrap: "wrap" }}>
              <button className="btn btn-primary" onClick={copyExport} disabled={exportBusy || !exportHtml}>{copied ? <><Check size={15} /> Kopiert</> : "Code kopieren"}</button>
              <button className="btn btn-ghost" onClick={downloadExport} disabled={exportBusy || !exportHtml}>Als .html herunterladen</button>
              <button className="btn btn-ghost" style={{ marginLeft: "auto" }} onClick={() => setExportOpen(false)}>Schließen</button>
            </div>
            {!published && !exportBusy && (
              <p className="muted" style={{ fontSize: ".8rem", marginTop: 10 }}>Hinweis: Exportiert wird der aktuelle Entwurf (auch ungespeicherte Änderungen im Editor).</p>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "var(--foreground)", color: "var(--card)", padding: "10px 18px", borderRadius: 8, fontSize: ".9rem", boxShadow: "var(--shadow-lg)", zIndex: 50 }}>{toast}</div>
      )}
    </div>
  );
}

function GroupLabel({ children, first }: { children: React.ReactNode; first?: boolean }) {
  return (
    <div style={{ fontSize: ".7rem", fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--muted-foreground)", margin: `${first ? 2 : 22}px 6px 9px`, userSelect: "none" }}>
      {children}
    </div>
  );
}

/** Eine Gruppe = Label + EINE weiße Karte, in der die Sektionen als Zeilen liegen. */
function Group({ label, first, children }: { label: string; first?: boolean; children: React.ReactNode }) {
  return (
    <>
      <GroupLabel first={first}>{label}</GroupLabel>
      <div className="section-group">{children}</div>
    </>
  );
}

function ListEditor<T>({ label, items, onAdd, onRemove, render }: {
  label: string; items: T[]; onAdd: () => void; onRemove: (i: number) => void; render: (item: T, i: number) => React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: ".82rem", fontFamily: "Poppins" }}>{label}</span>
        <button type="button" onClick={onAdd} className="btn btn-ghost" style={{ marginLeft: "auto", padding: ".3rem .7rem", fontSize: ".8rem" }}>+ Hinzufügen</button>
      </div>
      {items.map((item, i) => (
        <div key={i} style={{ border: "1px solid var(--tool-line)", borderRadius: 8, padding: 10, marginBottom: 8, background: "#fbfcfe" }}>
          {render(item, i)}
          <div style={{ textAlign: "right" }}><RowActions onRemove={() => onRemove(i)} /></div>
        </div>
      ))}
      {items.length === 0 && <p className="muted" style={{ fontSize: ".8rem" }}>Noch keine Einträge.</p>}
    </div>
  );
}

function newUnit(): Unit {
  return { id: `unit-${Math.random().toString(36).slice(2, 8)}`, name: "WE", floor: "", area: "", rooms: "", price: null, extra: "", status: "verfuegbar" };
}
