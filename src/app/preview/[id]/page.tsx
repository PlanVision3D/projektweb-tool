import { notFound } from "next/navigation";
import { getProject } from "@/lib/db";
import { getTemplate } from "@/templates/registry";

export const dynamic = "force-dynamic";

/** Vorschau des ENTWURFS – wird im Admin-Panel im rechten iframe angezeigt. */
export default async function Preview({ params }: { params: { id: string } }) {
  const project = await getProject(params.id);
  if (!project) notFound();
  const tpl = getTemplate(project.draft.template);
  const Component = tpl.Component!;
  return <Component content={project.draft} projectId={project.id} slug={project.slug} />;
}
