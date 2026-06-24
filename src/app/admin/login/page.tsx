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
      background: "var(--background)",
      fontFamily: "Inter, sans-serif", padding: 20,
    }}>
      <div style={{
        background: "var(--card)", borderRadius: 20, padding: "48px 40px",
        width: "100%", maxWidth: 410, boxShadow: "var(--shadow-2xl)",
        border: "1px solid var(--border)",
      }}>
        {/* Logo / Titel */}
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <img src="/planvision-logo-dark.png" alt="PlanVision3D" style={{ width: "100%", maxWidth: 240, height: "auto", display: "block", margin: "0 auto 22px" }} />
          <p style={{ margin: 0, color: "var(--muted-foreground)", fontSize: 14 }}>
            Admin-Bereich – Bitte anmelden
          </p>
        </div>

        <form onSubmit={submit}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
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
              width: "100%", padding: "12px 14px", borderRadius: 10,
              border: error ? "2px solid var(--destructive)" : "1px solid var(--border)",
              fontSize: 15, outline: "none", boxSizing: "border-box",
              transition: "border-color .2s", background: "var(--card)", color: "var(--foreground)",
            }}
          />
          {error && (
            <p style={{ margin: "8px 0 0", color: "var(--destructive)", fontSize: 13 }}>⚠ {error}</p>
          )}
          <button
            type="submit"
            disabled={busy}
            style={{
              marginTop: 20, width: "100%", padding: "13px",
              background: "var(--primary)", color: "var(--primary-foreground)",
              border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600,
              cursor: busy ? "not-allowed" : "pointer", transition: ".2s", opacity: busy ? 0.6 : 1,
              fontFamily: "Poppins, sans-serif",
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
