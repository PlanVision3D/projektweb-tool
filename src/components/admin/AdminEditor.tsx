"use client";
import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import type { Project, ProjectContent, Unit } from "@/types/content";
import { TEMPLATES } from "@/templates/registry";
import { Text, Area, Color, Select, Section, ImageField, RowActions } from "./fields";
import Icon, { ICON_OPTIONS, FEATURE_PRESETS } from "@/templates/modern/icons";

const STATUS_OPTIONS = [
  { value: "verfuegbar", label: "Verfügbar" },
  { value: "reserviert", label: "Reserviert" },
  { value: "vermietet", label: "Vermietet" },
  { value: "verkauft", label: "Verkauft" },
];

export default function AdminEditor({ project, canDelete = true, backHref = "/", leadsHref }: { project: Project; canDelete?: boolean; backHref?: string; leadsHref?: string }) {
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

  async function publish() {
    setPublishing(true);
    await fetch(`/api/projects/${project.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft, name }),
    });
    const res = await fetch(`/api/projects/${project.id}/publish`, { method: "POST" });
    setPublishing(false);
    if (res.ok) { setDirty(false); setPublished(true); setPreviewKey((k) => k + 1); flash("✅ Veröffentlicht! Die Live-Seite ist aktualisiert."); }
    else flash("Fehler beim Veröffentlichen.");
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* LEFT: Editor */}
      {resizing && <div style={{ position: "fixed", inset: 0, zIndex: 9999, cursor: "col-resize" }} />}
      <aside ref={asideRef} style={{ width: panelW, flexShrink: 0, borderRight: "1px solid var(--tool-line)", display: "flex", flexDirection: "column", background: "var(--tool-soft)" }}>
        <div style={{ padding: "14px 16px", background: "var(--tool-bg)", color: "#fff", display: "flex", alignItems: "center", gap: 10 }}>
          <Link href={backHref} style={{ color: "#c7d0de", textDecoration: "none", fontSize: ".85rem" }}>← Zurück</Link>
          <strong style={{ fontFamily: "Poppins", fontSize: ".95rem" }}>{name}</strong>
          {published ? <span className="pill pill-live">Live</span> : <span className="pill pill-draft">Entwurf</span>}
          <Link href={leadsLink} style={{ marginLeft: "auto", color: "#c7d0de", textDecoration: "none", fontSize: ".85rem" }}>📥 Leads</Link>
          {canDelete && <button onClick={removeProject} title="Projekt löschen" style={{ background: "transparent", border: "1px solid #6b3a3a", color: "#ff9a9a", borderRadius: 6, padding: ".25rem .6rem", cursor: "pointer", fontSize: ".8rem" }}>Löschen</button>}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
          {project.warnings.length > 0 && (
            <div className="warn-box">
              <h4>⚠ {project.warnings.length} Datenpunkte prüfen</h4>
              <ul>{project.warnings.map((w, i) => <li key={i}>{w.label}: {w.message}</li>)}</ul>
            </div>
          )}

          {/* Projektdaten / Branding */}
          <Section title="① Projektdaten & Branding" defaultOpen>
            <Text label="Projektname (intern)" value={name} onChange={(v) => { setName(v); setDirty(true); }} />
            <Select label="Template" value={draft.template}
              options={TEMPLATES.map((t) => ({ value: t.id, label: t.available ? t.name : `${t.name} (bald)` }))}
              onChange={(v) => patch((d) => { if (TEMPLATES.find((t) => t.id === v)?.available) d.template = v as any; })} />
            <Color label="Primärfarbe" value={draft.branding.primaryColor} onChange={(v) => patch((d) => { d.branding.primaryColor = v; })} />
            <Color label="Sekundärfarbe" value={draft.branding.secondaryColor} onChange={(v) => patch((d) => { d.branding.secondaryColor = v; })} />
            <ImageField label="Logo (optional)" url={draft.branding.logoUrl} projectId={project.id} onChange={(url) => patch((d) => { d.branding.logoUrl = url; })} />
          </Section>

          {/* Hero */}
          <Section title="② Hero-Bereich">
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
          <Section title="③ Projektübersicht">
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
          <Section title="④ Alleinstellungsmerkmale">
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
          <Section title="⑤ Besonderheiten / Highlights" badge={`${draft.features.length}`}>
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
          <Section title="⑥ Wohnungen / Preise / Status" badge={`${draft.units.items.length}`}>
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
          <Section title="⑦ Galerie / Visualisierungen" badge={`${draft.gallery.length}`}>
            <ListEditor label="Bilder" items={draft.gallery}
              onAdd={() => patch((d) => { d.gallery.push({ url: "" }); })}
              onRemove={(i) => patch((d) => { d.gallery.splice(i, 1); })}
              render={(g, i) => (<>
                <ImageField label={`Bild ${i + 1}`} url={g.url} projectId={project.id} onChange={(url) => patch((d) => { d.gallery[i].url = url; })} />
                <Text label="Bildunterschrift" value={g.caption || ""} onChange={(v) => patch((d) => { d.gallery[i].caption = v; })} />
              </>)} />
          </Section>

          {/* Virtueller Rundgang */}
          <Section title="⑦ᵇ Virtueller Rundgang" badge={`${draft.virtualTour.images.length}`}>
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
          <Section title="⑧ Lage">
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

          {/* Process */}
          <Section title="⑨ Ablauf">
            <ListEditor label="Schritte" items={draft.process}
              onAdd={() => patch((d) => { d.process.push({ title: "", description: "" }); })}
              onRemove={(i) => patch((d) => { d.process.splice(i, 1); })}
              render={(p, i) => (<>
                <Text label={`Schritt ${i + 1} – Titel`} value={p.title} onChange={(v) => patch((d) => { d.process[i].title = v; })} />
                <Area label="Beschreibung" value={p.description} onChange={(v) => patch((d) => { d.process[i].description = v; })} />
              </>)} />
          </Section>

          {/* FAQ */}
          <Section title="⑩ FAQ" badge={`${draft.faq.length}`}>
            <ListEditor label="Fragen" items={draft.faq}
              onAdd={() => patch((d) => { d.faq.push({ question: "", answer: "" }); })}
              onRemove={(i) => patch((d) => { d.faq.splice(i, 1); })}
              render={(f, i) => (<>
                <Text label="Frage" value={f.question} onChange={(v) => patch((d) => { d.faq[i].question = v; })} />
                <Area label="Antwort" value={f.answer} onChange={(v) => patch((d) => { d.faq[i].answer = v; })} />
              </>)} />
          </Section>

          {/* Contact */}
          <Section title="⑪ Ansprechpartner & Kontakt">
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

          {/* SEO + Legal */}
          <Section title="⑫ SEO & Impressum">
            <Text label="SEO-Titel" value={draft.seo.title} onChange={(v) => patch((d) => { d.seo.title = v; })} />
            <Area label="SEO-Beschreibung" value={draft.seo.description} onChange={(v) => patch((d) => { d.seo.description = v; })} />
            <hr style={{ border: "none", borderTop: "1px solid var(--tool-line)", margin: "12px 0" }} />
            <Text label="Firmenname" value={draft.legal.companyName} onChange={(v) => patch((d) => { d.legal.companyName = v; })} />
            <Text label="Straße" value={draft.legal.street} onChange={(v) => patch((d) => { d.legal.street = v; })} />
            <Text label="PLZ / Ort" value={draft.legal.cityZip} onChange={(v) => patch((d) => { d.legal.cityZip = v; })} />
            <Text label="Vertreten durch" value={draft.legal.representedBy || ""} onChange={(v) => patch((d) => { d.legal.representedBy = v; })} />
            <Text label="USt-IdNr." value={draft.legal.vatId || ""} onChange={(v) => patch((d) => { d.legal.vatId = v; })} />
          </Section>
        </div>

        {/* Toolbar */}
        <div style={{ padding: 14, borderTop: "1px solid var(--tool-line)", background: "#fff", display: "flex", gap: 8, alignItems: "center" }}>
          <span className="muted" style={{ fontSize: ".8rem" }}>{dirty ? "● Ungespeicherte Änderungen" : "Alles gespeichert"}</span>
          <button className="btn btn-ghost" style={{ marginLeft: "auto" }} onClick={save} disabled={saving || !dirty}>{saving ? "Speichert…" : "Speichern"}</button>
          <button className="btn btn-primary" onClick={publish} disabled={publishing}>{publishing ? "Veröffentlicht…" : "Veröffentlichen"}</button>
        </div>
      </aside>

      {/* Resize-Griff */}
      <div onMouseDown={startResize} onDoubleClick={() => setPanelW(520)} title="Ziehen zum Verbreitern (Doppelklick: zurücksetzen)"
        style={{ width: 8, flexShrink: 0, cursor: "col-resize", background: "var(--tool-line)", position: "relative", zIndex: 5 }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 4, height: 44, borderRadius: 4, background: "#9aa3b2" }} />
      </div>

      {/* RIGHT: Live preview */}
      <main style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", background: "#e9edf3" }}>
        <div style={{ height: 46, display: "flex", alignItems: "center", gap: 12, padding: "0 16px", borderBottom: "1px solid var(--tool-line)", background: "#fff" }}>
          <strong style={{ fontFamily: "Poppins", fontSize: ".85rem" }}>Live-Vorschau (Entwurf)</strong>
          <button className="btn btn-ghost" style={{ padding: ".3rem .7rem", fontSize: ".8rem" }} onClick={() => setPreviewKey((k) => k + 1)}>↻ Aktualisieren</button>
          {published && <Link className="btn btn-gold" style={{ padding: ".3rem .7rem", fontSize: ".8rem", marginLeft: "auto" }} href={`/site/${project.slug}`} target="_blank">Live-Seite öffnen ↗</Link>}
        </div>
        <iframe key={previewKey} src={`/preview/${project.id}?v=${previewKey}`} style={{ flex: 1, border: "none", width: "100%" }} title="Vorschau" />
      </main>

      {toast && (
        <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "var(--tool-bg)", color: "#fff", padding: "10px 18px", borderRadius: 8, fontSize: ".9rem", boxShadow: "0 8px 24px rgba(0,0,0,.25)", zIndex: 50 }}>{toast}</div>
      )}
    </div>
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
