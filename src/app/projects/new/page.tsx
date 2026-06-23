"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";

export default function NewProject() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
          <label className="field">
            <span>Projektdaten-Datei (.xlsx / .csv)</span>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <span className="muted" style={{ fontWeight: 400, marginTop: 6 }}>Optional – du kannst die Datei auch später im Admin importieren.</span>
          </label>
          {error && <p style={{ color: "#c62828" }}>{error}</p>}
          <button className="btn btn-primary" disabled={busy || !name}>{busy ? "Wird angelegt…" : "Projekt anlegen & importieren"}</button>
        </form>
      </main>
    </>
  );
}
