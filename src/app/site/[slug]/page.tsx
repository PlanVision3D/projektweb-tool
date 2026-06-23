import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/db";
import { getTemplate } from "@/templates/registry";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const project = await getProjectBySlug(params.slug);
  const c = project?.published;
  if (!c) return { title: "Seite nicht veröffentlicht" };
  return { title: c.seo.title || c.intro.projectName, description: c.seo.description };
}

/** LIVE-Seite – zeigt ausschließlich die VERÖFFENTLICHTE Version. */
export default async function Site({ params }: { params: { slug: string } }) {
  const project = await getProjectBySlug(params.slug);
  if (!project) notFound();
  if (!project.published) {
    return (
      <div style={{ fontFamily: "Inter, sans-serif", textAlign: "center", padding: "120px 20px", color: "#5c6672" }}>
        <h1 style={{ fontFamily: "Poppins" }}>Diese Projektseite ist noch nicht veröffentlicht.</h1>
        <p>Der Entwurf existiert, wurde aber noch nicht freigegeben.</p>
      </div>
    );
  }
  const tpl = getTemplate(project.published.template);
  const Component = tpl.Component!;
  return <Component content={project.published} projectId={project.id} slug={project.slug} />;
}
