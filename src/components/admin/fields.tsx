"use client";
import { useRef, useState } from "react";
import { ChevronRight } from "lucide-react";

const IMG_EXT = [".png", ".jpg", ".jpeg", ".svg", ".webp", ".gif"];

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

export function Section({ title, children, defaultOpen = false, badge, icon }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean; badge?: string; icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="section-row" style={{ background: open ? "var(--secondary)" : "transparent", transition: "background .12s" }}>
      <button type="button" onClick={() => setOpen(!open)} className="section-head"
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "13px 15px", background: "transparent", border: "none", cursor: "pointer", fontFamily: "Poppins", fontWeight: 600, fontSize: ".9rem", color: "var(--foreground)", textAlign: "left" }}>
        {icon && <span style={{ display: "inline-flex", color: open ? "var(--primary)" : "var(--muted-foreground)", flexShrink: 0, transition: ".12s" }}>{icon}</span>}
        <span style={{ flex: 1 }}>{title}</span>
        {badge && <span style={{ fontSize: ".72rem", fontWeight: 600, color: "var(--muted-foreground)", background: "var(--muted)", borderRadius: 20, padding: ".05rem .5rem", minWidth: 22, textAlign: "center", flexShrink: 0 }}>{badge}</span>}
        <ChevronRight size={16} style={{ color: "var(--muted-foreground)", transform: open ? "rotate(90deg)" : "none", transition: ".15s", flexShrink: 0 }} />
      </button>
      {open && <div style={{ padding: "8px 15px 16px", background: "var(--card)", borderTop: "1px solid var(--border)" }}>{children}</div>}
    </div>
  );
}

export function ImageField({ label, url, projectId, onChange }: {
  label: string; url?: string; projectId: string; onChange: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    const ok = IMG_EXT.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!ok) {
      setError("Bitte ein Bild (PNG, JPG, SVG oder WebP) auswählen. PDF wird nicht unterstützt.");
      return;
    }
    setError("");
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/projects/${projectId}/upload`, { method: "POST", body: fd });
    const data = await res.json();
    setBusy(false);
    if (data.url) onChange(data.url);
    else setError(data.error || "Upload fehlgeschlagen.");
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) upload(f);
  }

  return (
    <div className="field">
      <span>{label}</span>
      <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
        {url ? <img src={url} alt="" style={{ width: 90, height: 60, objectFit: "cover", borderRadius: 6, border: "1px solid var(--tool-line)" }} />
             : <div style={{ width: 90, height: 60, borderRadius: 6, background: "#eef1f6", display: "grid", placeItems: "center", color: "#9aa3b2", fontSize: ".7rem" }}>kein Bild</div>}
        <div
          role="button"
          tabIndex={0}
          onClick={() => !busy && inputRef.current?.click()}
          onKeyDown={(e) => { if (!busy && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); inputRef.current?.click(); } }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
          onDrop={onDrop}
          style={{
            flex: 1, display: "grid", placeItems: "center", textAlign: "center",
            border: `2px dashed ${dragging ? "var(--tool-accent)" : "var(--tool-line)"}`,
            borderRadius: 8, padding: "10px 12px", cursor: busy ? "default" : "pointer",
            background: dragging ? "var(--tool-soft)" : "#fff", transition: ".15s", fontSize: ".82rem",
          }}
        >
          {busy ? <span className="muted">lädt…</span>
                : <span>Bild hierher ziehen oder <strong>klicken</strong><br /><span className="muted">PNG, JPG, SVG, WebP</span></span>}
        </div>
        {url && !busy && (
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => { onChange(""); setError(""); }}
            style={{ padding: ".35rem .7rem", fontSize: ".8rem", alignSelf: "center" }}
          >
            Entfernen
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
          style={{ display: "none" }}
          disabled={busy}
          onChange={(e) => { if (e.target.files?.[0]) upload(e.target.files[0]); e.target.value = ""; }}
        />
      </div>
      {error && <span style={{ color: "#c62828", fontSize: ".8rem", display: "block", marginTop: 6 }}>{error}</span>}
    </div>
  );
}

export function RowActions({ onRemove }: { onRemove: () => void }) {
  return (
    <button type="button" onClick={onRemove} className="btn btn-danger" style={{ padding: ".35rem .7rem", fontSize: ".8rem" }}>Entfernen</button>
  );
}
