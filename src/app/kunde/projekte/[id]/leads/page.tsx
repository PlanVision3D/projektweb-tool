import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { currentCustomer } from "@/lib/auth";
import { getProject, listLeads } from "@/lib/db";
import CustomerHeader from "@/components/CustomerHeader";
import LeadsTable from "@/components/admin/LeadsTable";

export const dynamic = "force-dynamic";

export default async function KundeLeads({ params }: { params: { id: string } }) {
  const customer = await currentCustomer();
  if (!customer) redirect("/kunde/login");

  const project = await getProject(params.id);
  if (!project) notFound();
  // Zugriffsschutz: nur eigenes Projekt
  if (!project.assignedCustomerEmails.includes(customer.email)) {
    return (
      <>
        <CustomerHeader name={customer.name} />
        <main className="wrap"><div className="card empty"><h2>Kein Zugriff</h2><p className="muted">Dieses Projekt ist Ihrem Konto nicht zugewiesen.</p><Link className="btn btn-primary" href="/kunde">Zurück</Link></div></main>
      </>
    );
  }

  const leads = await listLeads(params.id);
  return (
    <>
      <CustomerHeader name={customer.name} />
      <main className="wrap">
        <Link href="/kunde" className="muted" style={{ textDecoration: "none" }}>← Zurück zu Ihren Projekten</Link>
        <h1 style={{ margin: "4px 0 0" }}>Anfragen · {project.name}</h1>
        <p className="muted" style={{ margin: "4px 0 18px" }}>{leads.length} Anfrage(n) über das Kontaktformular Ihrer Webseite.</p>
        <LeadsTable leads={leads} />
      </main>
    </>
  );
}
