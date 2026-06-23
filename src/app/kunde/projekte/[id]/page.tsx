import { redirect, notFound } from "next/navigation";
import { currentCustomer } from "@/lib/auth";
import { getProject } from "@/lib/db";
import AdminEditor from "@/components/admin/AdminEditor";

export const dynamic = "force-dynamic";

/** Kunde bearbeitet sein eigenes Projekt – gleicher Editor wie Admin, aber ohne Löschen. */
export default async function KundeEditor({ params }: { params: { id: string } }) {
  const customer = await currentCustomer();
  if (!customer) redirect("/kunde/login");
  const project = await getProject(params.id);
  if (!project) notFound();
  if (!project.assignedCustomerEmails.includes(customer.email)) {
    return (
      <main className="wrap"><div className="card empty"><h2>Kein Zugriff</h2><p className="muted">Dieses Projekt ist Ihrem Konto nicht zugewiesen.</p><a className="btn btn-primary" href="/kunde">Zurück</a></div></main>
    );
  }
  return <AdminEditor project={project} canDelete={false} canExport={false} backHref="/kunde" leadsHref={`/kunde/projekte/${project.id}/leads`} />;
}
