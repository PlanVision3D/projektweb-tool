"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ExternalLink, LogOut } from "lucide-react";

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
        <Link href="/projects/new"><Plus size={16} /> Neues Projekt</Link>
        <a href="/kunde/login" target="_blank" rel="noreferrer">Kundenbereich <ExternalLink size={14} /></a>
        <button onClick={logout} className="btn btn-ghost btn-sm" style={{ marginLeft: 6 }}>
          <LogOut size={15} /> Abmelden
        </button>
      </nav>
    </header>
  );
}
