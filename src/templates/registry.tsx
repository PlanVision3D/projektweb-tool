import type { ComponentType } from "react";
import type { ProjectContent, TemplateId } from "@/types/content";
import ModernTemplate from "./modern/ModernTemplate";

/**
 * TEMPLATE-REGISTRY
 * -----------------
 * Ein neues Template hinzufügen = Komponente bauen + hier eintragen.
 * Der Rest des Systems (Admin-Auswahl, Vorschau, Live-Seite) funktioniert
 * automatisch, ohne weitere Änderungen.
 */

export interface TemplateMeta {
  id: TemplateId;
  name: string;
  tagline: string;
  description: string;
  available: boolean;
  Component?: ComponentType<{ content: ProjectContent; projectId?: string; slug?: string }>;
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "modern",
    name: "Modern / Hochwertig",
    tagline: "Klar, edel, kontrastreich",
    description: "Großer Bild-Hero, Fakten-Kacheln, kräftige Akzentfarbe. Ideal für hochwertige Neubauprojekte.",
    available: true,
    Component: ModernTemplate,
  },
  {
    id: "natural",
    name: "Natürlich / Elegant",
    tagline: "Warm, organisch, ruhig",
    description: "Sanfte Erd-/Grüntöne, viel Weißraum, serifenbetonte Typografie. Für naturnahe, gehobene Wohnprojekte. (Bald verfügbar)",
    available: false,
  },
  {
    id: "minimal",
    name: "Minimalistisch / Urban",
    tagline: "Reduziert, typografisch, urban",
    description: "Schwarz-weiß mit einem Akzent, klare Raster, große Typo. Für urbane, designaffine Zielgruppen. (Bald verfügbar)",
    available: false,
  },
];

export function getTemplate(id: TemplateId): TemplateMeta {
  return TEMPLATES.find((t) => t.id === id && t.available) ?? TEMPLATES[0];
}
