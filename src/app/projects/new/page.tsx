"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";

const ACCEPTED = [".xlsx", ".xls", ".csv"];

export default function NewProject() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function pickFile(f: File | null) {
    if (!f) return;
    const ok = ACCEPTED.some((ext) => f.name.toLowerCase().endsWith(ext));
    if (!ok) {
      setError("Bitte eine .xlsx-, .xls- oder .csv-Datei auswählen.");
      return;
    }
    setError("");
    setFile(f);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files?.[0] ?? null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("name", name);
      if (file) fd.append("file", file);
      const res = await fetch("/api/projects", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler beim Anlegen.");
      router.push(`/projects/${data.id}`);
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <>
      <TopBar />
      <main className="wrap" style={{ maxWidth: 640 }}>
        <h1>Neues Projekt anlegen</h1>
        <p className="muted">Gib dem Projekt einen Namen und lade die Projektdaten-Datei (Google-Sheets-Export als .xlsx oder .csv) hoch. Die Daten werden ausgelesen und strukturiert gespeichert.</p>
        <form className="card" onSubmit={submit} style={{ marginTop: 16 }}>
          <label className="field">
            <span>Projektname *</span>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Wohnen in der Südstadt" />
          </label>
          <div className="field">
            <span>Projektdaten-Datei (.xlsx / .csv)</span>
            <div
              className="dropzone"
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
              onDrop={onDrop}
              style={{
                cursor: "pointer",
                padding: 28,
                borderColor: dragging ? "var(--tool-accent)" : "var(--tool-line)",
                background: dragging ? "var(--tool-soft)" : "#fff",
                transition: ".15s",
              }}
            >
              {file ? (
                <div>
                  <strong>{file.name}</strong>
                  <div className="muted" style={{ marginTop: 4 }}>{(file.size / 1024).toFixed(0)} KB · zum Ersetzen klicken oder neue Datei ablegen</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: 600 }}>Datei hierher ziehen oder klicken zum Auswählen</div>
                  <div className="muted" style={{ marginTop: 4 }}>.xlsx, .xls oder .csv</div>
                </div>
              )}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: "none" }}
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
            <span className="muted" style={{ fontWeight: 400, display: "block", marginTop: 6 }}>Optional – du kannst die Datei auch später im Admin importieren.</span>
          </div>
          {error && <p style={{ color: "#c62828" }}>{error}</p>}
          <button className="btn btn-primary" disabled={busy || !name}>{busy ? "Wird angelegt…" : "Projekt anlegen & importieren"}</button>
        </form>
      </main>
    </>
  );
}
