import Link from "next/link";
import { listProjects, countLeads } from "@/lib/db";
import TopBar from "@/components/TopBar";
import ProjectCard from "@/components/ProjectCard";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const projects = await listProjects();
  const cards = await Promise.all(projects.map(async (p) => ({
    id: p.id, slug: p.slug, name: p.name, published: !!p.published,
    unitsCount: p.draft.units.items.length, template: p.draft.template,
    warningsCount: p.warnings.length, heroImageUrl: p.draft.hero.image?.url,
    leadsCount: await countLeads(p.id), assignedCustomerEmails: p.assignedCustomerEmails || [],
    customDomain: p.customDomain,
  })));
  return (
    <>
      <TopBar />
      <main className="wrap">
        <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0 }}>Projekte</h1>
            <p className="muted" style={{ margin: "4px 0 0" }}>Neubau-Projektwebseiten aus Google-Sheets-Daten generieren und verwalten.</p>
          </div>
          <Link href="/projects/new" className="btn btn-primary" style={{ marginLeft: "auto" }}>+ Neues Projekt</Link>
        </div>

        {projects.length === 0 ? (
          <div className="card empty">
            <h2>Noch keine Projekte</h2>
            <p className="muted">Lege dein erstes Projekt an und lade die Google-Sheets-/Excel-Datei hoch.</p>
            <Link href="/projects/new" className="btn btn-primary">+ Projekt anlegen</Link>
          </div>
        ) : (
          <div className="grid-cards">
            {cards.map((c) => <ProjectCard key={c.id} p={c} />)}
          </div>
        )}
      </main>
    </>
  );
}
