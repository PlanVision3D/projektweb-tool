import Link from "next/link";
import { redirect } from "next/navigation";
import { currentCustomer } from "@/lib/auth";
import { projectsForCustomer, countLeads } from "@/lib/db";
import CustomerHeader from "@/components/CustomerHeader";

export const dynamic = "force-dynamic";

export default async function KundeDashboard() {
  const customer = await currentCustomer();
  if (!customer) redirect("/kunde/login");

  const projects = await projectsForCustomer(customer.email);
  const cards = await Promise.all(projects.map(async (p) => ({
    id: p.id, slug: p.slug, name: p.name, published: !!p.published,
    units: p.draft.units.items.length, heroImageUrl: p.draft.hero.image?.url,
    leads: await countLeads(p.id),
  })));

  return (
    <>
      <CustomerHeader name={customer.name} />
      <main className="wrap">
        <h1>Ihre Projekte</h1>
        <p className="muted">Willkommen, {customer.name}. Hier sehen Sie Ihre Projekte und die eingegangenen Anfragen.</p>

        {cards.length === 0 ? (
          <div className="card empty">
            <h2>Noch keine Projekte freigegeben</h2>
            <p className="muted">Sobald Ihnen ein Projekt zugewiesen wurde, erscheint es hier.</p>
          </div>
        ) : (
          <div className="grid-cards">
            {cards.map((c) => (
              <div key={c.id} className="card project-card">
                <div className="thumb" style={{ backgroundImage: c.heroImageUrl ? `url(${c.heroImageUrl})` : undefined }} />
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <strong>{c.name}</strong>
                  {c.published && <span className="pill pill-live">Live</span>}
                </div>
                <p className="muted" style={{ margin: "6px 0 10px" }}>{c.units} Wohneinheiten · {c.leads} Anfragen</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Link className="btn btn-primary" style={{ padding: ".45rem .9rem", fontSize: ".85rem" }} href={`/kunde/projekte/${c.id}`}>✏️ Bearbeiten</Link>
                  <Link className="btn btn-ghost" style={{ padding: ".45rem .9rem", fontSize: ".85rem" }} href={`/kunde/projekte/${c.id}/leads`}>📥 Anfragen ({c.leads})</Link>
                  {c.published && <a className="btn btn-ghost" style={{ padding: ".45rem .9rem", fontSize: ".85rem" }} href={`/site/${c.slug}`} target="_blank" rel="noreferrer">🌐 Webseite</a>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
