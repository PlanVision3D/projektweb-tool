"use client";
import { useRouter } from "next/navigation";

export default function CustomerHeader({ name }: { name: string }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/kunde/logout", { method: "POST" });
    router.push("/kunde/login");
    router.refresh();
  }
  return (
    <header className="topbar">
      <span className="brand">Kunden<span>·Bereich</span></span>
      <nav>
        <span style={{ color: "#c7d0de" }}>Angemeldet als {name}</span>
        <button onClick={logout} style={{ background: "transparent", border: "1px solid #3a4256", color: "#c7d0de", borderRadius: 6, padding: ".3rem .7rem", cursor: "pointer" }}>Abmelden</button>
      </nav>
    </header>
  );
}
