import { notFound } from "next/navigation";
import { getProject } from "@/lib/db";
import AdminEditor from "@/components/admin/AdminEditor";

export const dynamic = "force-dynamic";

export default async function AdminPage({ params }: { params: { id: string } }) {
  const project = await getProject(params.id);
  if (!project) notFound();
  return <AdminEditor project={project} />;
}
