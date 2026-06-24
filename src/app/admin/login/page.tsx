"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setBusy(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (!res.ok) { setError("Falsches Passwort."); return; }
    router.push(from);
    router.refresh();
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #1e3a5f 0%, #396189 100%)",
      fontFamily: "Inter, sans-serif",
    }}>
      <div style={{
        background: "white", borderRadius: 16, padding: "48px 40px",
        width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        {/* Logo / Titel */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, background: "#396189",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px", fontSize: 24,
          }}>🏗️</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1a2a3a", fontFamily: "Poppins, sans-serif" }}>
            Projektweb-Tool
          </h1>
          <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: 14 }}>
            Admin-Bereich – Bitte anmelden
          </p>
        </div>

        <form onSubmit={submit}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#374151" }}>
            Passwort
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoFocus
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 8,
              border: error ? "2px solid #ef4444" : "2px solid #e5e7eb",
              fontSize: 15, outline: "none", boxSizing: "border-box",
              transition: "border-color .2s",
            }}
          />
          {error && (
            <p style={{ margin: "8px 0 0", color: "#ef4444", fontSize: 13 }}>⚠ {error}</p>
          )}
          <button
            type="submit"
            disabled={busy}
            style={{
              marginTop: 20, width: "100%", padding: "13px",
              background: busy ? "#9ca3af" : "#396189", color: "white",
              border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600,
              cursor: busy ? "not-allowed" : "pointer", transition: "background .2s",
            }}
          >
            {busy ? "Wird geprüft…" : "Anmelden →"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
