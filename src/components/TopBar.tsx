import Link from "next/link";

export default function TopBar() {
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
      </nav>
    </header>
  );
}
