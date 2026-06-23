"use client";
import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";

interface CustomerView { id: string; name: string; email: string; createdAt: string }

export default function KundenPage() {
  const [customers, setCustomers] = useState<CustomerView[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/customers");
    setCustomers(await res.json());
  }
  useEffect(() => { load(); }, []);

  function genPassword() {
    setPassword(Math.random().toString(36).slice(2, 6) + "-" + Math.random().toString(36).slice(2, 6));
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setBusy(true);
    const res = await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setError(data.error || "Fehler."); return; }
    alert(`Kunde angelegt!\n\nZugangsdaten zum Weitergeben:\nLogin-Seite: ${location.origin}/kunde/login\nE-Mail: ${email}\nPasswort: ${password}`);
    setName(""); setEmail(""); setPassword(""); load();
  }

  async function remove(id: string, n: string) {
    if (!confirm(`Kunde „${n}“ wirklich löschen? Der Zugang wird entzogen.`)) return;
    await fetch(`/api/customers/${id}`, { method: "DELETE" });
    load();
  }

  async function resetPw(id: string) {
    const pw = prompt("Neues Passwort für diesen Kunden:");
    if (!pw) return;
    await fetch(`/api/customers/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
    alert("Passwort geändert. Bitte dem Kunden mitteilen.");
  }

  return (
    <>
      <TopBar />
      <main className="wrap">
        <h1>Kunden</h1>
        <p className="muted">Lege Kunden an und gib ihnen die Zugangsdaten. Kunden sehen unter <code>/kunde</code> nur die ihnen zugewiesenen Projekte und deren Leads.</p>

        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 24, marginTop: 20, alignItems: "start" }}>
          <form className="card" onSubmit={create}>
            <h3 style={{ marginTop: 0 }}>Neuen Kunden anlegen</h3>
            <label className="field"><span>Name *</span><input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Max Mustermann" /></label>
            <label className="field"><span>E-Mail (Login) *</span><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="kunde@firma.de" /></label>
            <label className="field"><span>Passwort *</span>
              <div style={{ display: "flex", gap: 8 }}>
                <input type="text" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Initialpasswort" />
                <button type="button" className="btn btn-ghost" onClick={genPassword}>🎲</button>
              </div>
            </label>
            {error && <p style={{ color: "#c62828" }}>{error}</p>}
            <button className="btn btn-primary" disabled={busy}>{busy ? "…" : "Kunde anlegen"}</button>
          </form>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Angelegte Kunden ({customers.length})</h3>
            {customers.length === 0 ? <p className="muted">Noch keine Kunden.</p> : (
              <table className="lead-table">
                <thead><tr><th>Name</th><th>E-Mail</th><th>Angelegt</th><th></th></tr></thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td>{c.name}</td><td>{c.email}</td>
                      <td>{new Date(c.createdAt).toLocaleDateString("de-DE")}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <button className="btn btn-ghost" style={{ padding: ".3rem .6rem", fontSize: ".8rem" }} onClick={() => resetPw(c.id)}>Passwort</button>{" "}
                        <button className="btn btn-danger" style={{ padding: ".3rem .6rem", fontSize: ".8rem" }} onClick={() => remove(c.id, c.name)}>Löschen</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="muted" style={{ marginTop: 14 }}>Projekt zuweisen: im Dashboard über das ⋯-Menü „Mit Kunde teilen / zuweisen“ die E-Mail des Kunden eintragen.</p>
          </div>
        </div>
      </main>
    </>
  );
}
