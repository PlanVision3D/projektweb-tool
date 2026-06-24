"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TopBar() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <header className="topbar">
      <Link href="/" className="brand" style={{ color: "#fff", textDecoration: "none" }}>
        Projektweb<span>·Tool</span>
      </Link>
      <nav>
        <Link href="/">Projekte</Link>
        <Link href="/kunden">Kunden</Link>
        <Link href="/projects/new">+ Neues Projekt</Link>
        <a href="/kunde/login" target="_blank" rel="noreferrer">Kundenbereich ↗</a>
        <button
          onClick={logout}
          style={{
            background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
            color: "white", padding: "6px 14px", borderRadius: 6, cursor: "pointer",
            fontSize: 13, fontWeight: 500,
          }}
        >
          Abmelden
        </button>
      </nav>
    </header>
  );
}
