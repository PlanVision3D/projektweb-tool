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
      <Link href="/" className="brand" style={{ textDecoration: "none" }}>
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
            marginLeft: 6, background: "var(--card)", border: "1px solid var(--border)",
            color: "var(--muted-foreground)", padding: "7px 14px", borderRadius: 8, cursor: "pointer",
            fontSize: 13, fontWeight: 600, fontFamily: "Poppins", transition: ".15s",
          }}
        >
          Abmelden
        </button>
      </nav>
    </header>
  );
}
