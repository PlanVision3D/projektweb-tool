import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, listLeads } from "@/lib/db";
import TopBar from "@/components/TopBar";
import LeadsTable from "@/components/admin/LeadsTable";

export const dynamic = "force-dynamic";

export default async function LeadsPage({ params }: { params: { id: string } }) {
  const project = await getProject(params.id);
  if (!project) notFound();
  const leads = await listLeads(params.id);

  return (
    <>
      <TopBar />
      <main className="wrap">
        <div style={{ display: "flex", alignItems: "center", marginBottom: 20, gap: 12 }}>
          <div>
            <Link href={`/projects/${project.id}`} className="muted" style={{ textDecoration: "none" }}>← Zurück zum Editor</Link>
            <h1 style={{ margin: "4px 0 0" }}>Leads · {project.name}</h1>
            <p className="muted" style={{ margin: "4px 0 0" }}>
              {leads.length} Anfrage(n) über das Kontaktformular.
              {project.leadsSheetId && <> · Google-Sheet-ID: <code>{project.leadsSheetId}</code></>}
            </p>
          </div>
        </div>
        <LeadsTable leads={leads} />
      </main>
    </>
  );
}
