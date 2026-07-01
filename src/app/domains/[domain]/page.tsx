import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectByDomain } from "@/lib/db";
import { getTemplate } from "@/templates/registry";

// ISR: Seite statisch cachen (aus dem CDN ausliefern) statt bei jedem Besuch neu zu
// rendern. Aktualisiert wird sie sofort beim Veröffentlichen (on-demand revalidation
// in der Publish-Route) – die 1h ist nur ein Sicherheitsnetz, falls das mal ausfällt.
export const revalidate = 3600;
// Leeres Array = nichts beim Build vorbauen, aber unbekannte Domains on-demand
// generieren UND cachen (statt bei jedem Besuch neu zu rendern).
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: { domain: string } }): Promise<Metadata> {
  const project = await getProjectByDomain(decodeURIComponent(params.domain));
  const c = project?.published;
  if (!c) return { title: "Seite nicht gefunden" };
  return { title: c.seo.title || c.intro.projectName, description: c.seo.description };
}

/**
 * LIVE-Seite unter einer eigenen Domain (z.B. suedstadt-erbach.de).
 * Die Middleware schreibt solche Anfragen auf /domains/<domain> um.
 * Interne Links werden über basePath="" relativ zur Domain-Wurzel gebaut.
 */
export default async function DomainSite({ params }: { params: { domain: string } }) {
  const project = await getProjectByDomain(decodeURIComponent(params.domain));
  if (!project || !project.published) notFound();

  const tpl = getTemplate(project.published.template);
  const Component = tpl.Component!;
  return <Component content={project.published} projectId={project.id} slug={project.slug} basePath="" />;
}
