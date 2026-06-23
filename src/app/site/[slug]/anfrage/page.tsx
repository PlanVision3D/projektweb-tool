import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/db";
import AnfrageForm from "@/templates/modern/AnfrageForm";

export const dynamic = "force-dynamic";

export default async function AnfragePage({ params }: { params: { slug: string } }) {
  const project = await getProjectBySlug(params.slug);
  if (!project) notFound();
  const content = project.published ?? project.draft;
  return <AnfrageForm content={content} projectId={project.id} slug={project.slug} />;
}
