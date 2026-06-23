"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function KundeLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setBusy(true);
    const res = await fetch("/api/kunde/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setError(data.error || "Login fehlgeschlagen."); return; }
    router.push("/kunde");
    router.refresh();
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--tool-bg)", fontFamily: "Inter, sans-serif" }}>
      <form onSubmit={submit} style={{ background: "#fff", borderRadius: 14, padding: 36, width: "min(420px, 92vw)", boxShadow: "0 20px 50px rgba(0,0,0,.3)" }}>
        <h1 style={{ fontFamily: "Poppins", margin: "0 0 4px" }}>Kundenbereich</h1>
        <p className="muted" style={{ marginTop: 0 }}>Bitte melden Sie sich mit Ihren Zugangsdaten an.</p>
        <label className="field"><span>E-Mail</span><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="field"><span>Passwort</span><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {error && <p style={{ color: "#c62828" }}>{error}</p>}
        <button className="btn btn-primary" disabled={busy} style={{ width: "100%", justifyContent: "center", marginTop: 6 }}>{busy ? "Anmelden…" : "Anmelden"}</button>
      </form>
    </div>
  );
}
