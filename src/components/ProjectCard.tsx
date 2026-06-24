"use client";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

export interface ProjectCardData {
  id: string;
  slug: string;
  name: string;
  published: boolean;
  unitsCount: number;
  template: string;
  warningsCount: number;
  heroImageUrl?: string;
  leadsCount: number;
  assignedCustomerEmails: string[];
  customDomain?: string;
}
interface CustomerView { id: string; name: string; email: string }

export default function ProjectCard({ p }: { p: ProjectCardData }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [customers, setCustomers] = useState<CustomerView[]>([]);
  const [selected, setSelected] = useState<string[]>(p.assignedCustomerEmails);
  const [domainOpen, setDomainOpen] = useState(false);
  const [domain, setDomain] = useState(p.customDomain || "");
  const [domainErr, setDomainErr] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function remove() {
    if (!confirm(`Projekt „${p.name}“ wirklich unwiderruflich löschen?\nAlle Daten, Bilder und Leads gehen verloren.`)) return;
    setBusy(true);
    const res = await fetch(`/api/projects/${p.id}`, { method: "DELETE" });
    if (res.ok) router.refresh(); else { setBusy(false); alert("Fehler beim Löschen."); }
  }

  async function openShare() {
    setOpen(false);
    const res = await fetch("/api/customers");
    setCustomers(await res.json());
    setSelected(p.assignedCustomerEmails);
    setShareOpen(true);
  }
  function toggle(email: string) {
    setSelected((s) => (s.includes(email) ? s.filter((e) => e !== email) : [...s, email]));
  }
  async function saveShare() {
    setBusy(true);
    const res = await fetch(`/api/projects/${p.id}/assign`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ emails: selected }) });
    setBusy(false); setShareOpen(false);
    if (res.ok) router.refresh(); else alert("Fehler beim Zuweisen.");
  }

  function openDomain() {
    setOpen(false);
    setDomain(p.customDomain || "");
    setDomainErr("");
    setDomainOpen(true);
  }
  async function saveDomain() {
    setBusy(true); setDomainErr("");
    const res = await fetch(`/api/projects/${p.id}/domain`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domain }) });
    const data = await res.json();
    setBusy(false);
    if (res.ok) { setDomainOpen(false); router.refresh(); }
    else setDomainErr(data.error || "Fehler beim Speichern.");
  }

  return (
    <div className="card project-card" style={{ position: "relative", opacity: busy ? 0.6 : 1 }}>
      <button className="card-menu-btn" onClick={() => setOpen((o) => !o)} aria-label="Menü" title="Aktionen">⋯</button>
      {open && (
        <div className="card-menu" ref={ref}>
          <button onClick={() => router.push(`/projects/${p.id}`)}>✏️ Bearbeiten</button>
          {p.published && <a href={`/site/${p.slug}`} target="_blank" rel="noreferrer">🌐 Live-Seite öffnen</a>}
          <button onClick={() => router.push(`/projects/${p.id}/leads`)}>📥 Leads ansehen ({p.leadsCount})</button>
          <button onClick={openShare}>👥 Kunden zuweisen</button>
          <button onClick={openDomain}>🔗 Domain verknüpfen</button>
          <button className="danger" onClick={remove}>🗑️ Löschen</button>
        </div>
      )}
      <div onClick={() => router.push(`/projects/${p.id}`)} style={{ cursor: "pointer" }}>
        <div className="thumb" style={{ backgroundImage: p.heroImageUrl ? `url(${p.heroImageUrl})` : undefined }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <strong>{p.name}</strong>
          {p.published ? <span className="pill pill-live">Live</span> : <span className="pill pill-draft">Entwurf</span>}
        </div>
        <p className="muted" style={{ margin: "6px 0 8px" }}>{p.unitsCount} Wohneinheiten · {p.leadsCount} Leads · {p.template}</p>
        {p.customDomain && (
          <p style={{ margin: "0 0 8px", fontSize: ".82rem" }}>
            <span className="chip" style={{ background: "#e7f0e0", color: "#3c5a1f" }}>🔗 {p.customDomain}</span>
          </p>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {p.assignedCustomerEmails.length === 0
            ? <span className="muted" style={{ fontSize: ".78rem" }}>Keinem Kunden zugewiesen</span>
            : p.assignedCustomerEmails.map((e) => <span key={e} className="chip">👤 {e}</span>)}
        </div>
        {p.warningsCount > 0 && <p className="muted" style={{ color: "#b26a00", marginTop: 6 }}>⚠ {p.warningsCount} offene Datenpunkte</p>}
      </div>

      {shareOpen && typeof document !== "undefined" && createPortal(
        <div className="modal-backdrop" onClick={() => setShareOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Kunden zuweisen</h3>
            <p className="muted" style={{ marginTop: 0 }}>Wählen Sie, welche Kunden „{p.name}“ in ihrem Kundenbereich sehen und bearbeiten dürfen.</p>
            {customers.length === 0 ? (
              <p className="muted">Noch keine Kunden angelegt. <a href="/kunden">Jetzt Kunden anlegen →</a></p>
            ) : (
              <div style={{ display: "grid", gap: 6, maxHeight: 280, overflowY: "auto", margin: "10px 0" }}>
                {customers.map((c) => (
                  <label key={c.id} className="cust-row">
                    <input type="checkbox" checked={selected.includes(c.email)} onChange={() => toggle(c.email)} />
                    <span><strong>{c.name}</strong><br /><span className="muted" style={{ fontSize: ".82rem" }}>{c.email}</span></span>
                  </label>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
              <button className="btn btn-ghost" onClick={() => setShareOpen(false)}>Abbrechen</button>
              <button className="btn btn-primary" onClick={saveShare} disabled={busy}>Speichern</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {domainOpen && typeof document !== "undefined" && createPortal(
        <div className="modal-backdrop" onClick={() => setDomainOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Domain verknüpfen</h3>
            <p className="muted" style={{ marginTop: 0 }}>
              Trage hier die eigene Domain für „{p.name}“ ein. Besucher dieser Domain sehen dann direkt diese Projektseite.
            </p>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="z.B. suedstadt-erbach.de"
              style={{ width: "100%", padding: "11px 13px", borderRadius: 8, border: domainErr ? "2px solid #ef4444" : "2px solid #e5e7eb", fontSize: 15, boxSizing: "border-box", outline: "none" }}
            />
            {domainErr && <p style={{ color: "#ef4444", fontSize: 13, margin: "8px 0 0" }}>⚠ {domainErr}</p>}
            <div style={{ background: "#f4f7fb", borderRadius: 8, padding: "12px 14px", margin: "14px 0 0", fontSize: ".82rem", lineHeight: 1.5, color: "#475569" }}>
              <strong>So geht's:</strong>
              <ol style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                <li>Domain hier eintragen &amp; speichern</li>
                <li>Domain in Vercel unter <em>Settings → Domains</em> hinzufügen</li>
                <li>Beim Domain-Anbieter den von Vercel angezeigten DNS-Eintrag setzen</li>
              </ol>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => setDomainOpen(false)}>Abbrechen</button>
              <button className="btn btn-primary" onClick={saveDomain} disabled={busy}>Speichern</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
