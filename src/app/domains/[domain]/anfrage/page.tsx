import { notFound } from "next/navigation";
import { getProjectByDomain } from "@/lib/db";
import AnfrageForm from "@/templates/modern/AnfrageForm";

export const revalidate = 3600; // ISR – siehe ../page.tsx
export function generateStaticParams() {
  return [];
}

/** Anfrage-Seite unter einer eigenen Domain, z.B. suedstadt-erbach.de/anfrage */
export default async function DomainAnfragePage({ params }: { params: { domain: string } }) {
  const project = await getProjectByDomain(decodeURIComponent(params.domain));
  if (!project) notFound();
  const content = project.published ?? project.draft;
  return <AnfrageForm content={content} projectId={project.id} slug={project.slug} basePath="" />;
}
