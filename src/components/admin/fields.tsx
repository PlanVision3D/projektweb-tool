"use client";
import { useState } from "react";

export function Text({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function Area({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function Color({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: 48, height: 38, padding: 2 }} />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={{ flex: 1 }} />
      </div>
    </label>
  );
}

export function Select({ label, value, options, onChange }: {
  label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function Section({ title, children, defaultOpen = false, badge }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean; badge?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: "1px solid var(--tool-line)", borderRadius: 10, marginBottom: 10, background: "#fff", overflow: "hidden" }}>
      <button type="button" onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", background: open ? "#f8fafc" : "#fff", border: "none", cursor: "pointer", fontFamily: "Poppins", fontWeight: 600, fontSize: ".92rem", textAlign: "left" }}>
        <span style={{ transform: open ? "rotate(90deg)" : "none", transition: ".15s", color: "var(--tool-muted)" }}>▶</span>
        {title}
        {badge && <span className="pill pill-draft" style={{ marginLeft: "auto" }}>{badge}</span>}
      </button>
      {open && <div style={{ padding: "14px 16px", borderTop: "1px solid var(--tool-line)" }}>{children}</div>}
    </div>
  );
}

export function ImageField({ label, url, projectId, onChange }: {
  label: string; url?: string; projectId: string; onChange: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  async function upload(file: File) {
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/projects/${projectId}/upload`, { method: "POST", body: fd });
    const data = await res.json();
    setBusy(false);
    if (data.url) onChange(data.url);
  }
  return (
    <label className="field">
      <span>{label}</span>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {url ? <img src={url} alt="" style={{ width: 90, height: 60, objectFit: "cover", borderRadius: 6, border: "1px solid var(--tool-line)" }} />
             : <div style={{ width: 90, height: 60, borderRadius: 6, background: "#eef1f6", display: "grid", placeItems: "center", color: "#9aa3b2", fontSize: ".7rem" }}>kein Bild</div>}
        <input type="file" accept="image/*" disabled={busy} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        {busy && <span className="muted">lädt…</span>}
      </div>
    </label>
  );
}

export function RowActions({ onRemove }: { onRemove: () => void }) {
  return (
    <button type="button" onClick={onRemove} className="btn btn-danger" style={{ padding: ".35rem .7rem", fontSize: ".8rem" }}>Entfernen</button>
  );
}
