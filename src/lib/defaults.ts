import type { ProjectContent } from "@/types/content";

/** Leeres, valides Grundgerüst – Basis für jeden Import/jedes neue Projekt. */
export function emptyContent(): ProjectContent {
  return {
    schemaVersion: 1,
    template: "modern",
    branding: { primaryColor: "#396189", secondaryColor: "#ceb475", ctaColor: "#6f9a3c", badgeColor: "#b56a43", font: "Poppins" },
    hero: { headline: "", ctaText: "Jetzt anfragen!", facts: [] },
    intro: { projectName: "", paragraphs: [], facts: [], images: [] },
    usps: [],
    features: [],
    units: { floors: [], items: [], note: "", floorPlans: [], finderHint: "Bitte wählen Sie ein Geschoss, um Grundriss, Flächen und Mietpreise zu sehen." },
    virtualTour: { heading: "Virtueller Rundgang", subheading: "Musterwohnung", images: [] },
    location: { address: "", advantages: [] },
    gallery: [],
    floorplans: [],
    process: [],
    faq: [],
    contact: { persons: [], recipientEmails: [], formFields: defaultFormFields() },
    seo: { title: "", description: "" },
    legal: { companyName: "", street: "", cityZip: "" },
  };
}

export function defaultFormFields() {
  return [
    {
      key: "groesse",
      label: "Für welche Wohnungsgröße interessieren Sie sich?",
      type: "select" as const,
      required: true,
      options: ["2-Zimmer-Wohnung", "3-Zimmer-Wohnung", "4-Zimmer-Wohnung", "5-Zimmer-Wohnung", "Noch unentschieden"],
    },
    {
      key: "art",
      label: "Interessieren Sie sich für Kauf oder Miete?",
      type: "select" as const,
      required: true,
      options: ["Kauf", "Miete", "Noch unentschieden"],
    },
    {
      key: "erreichbar",
      label: "Wann sind Sie am besten erreichbar?",
      type: "select" as const,
      required: true,
      options: ["Vormittags", "Nachmittags", "Abends", "Jederzeit"],
    },
    { key: "name", label: "Ihr vollständiger Name", type: "text" as const, required: true },
    { key: "telefon", label: "Ihre Telefonnummer", type: "tel" as const, required: true },
    { key: "email", label: "Ihre E-Mail-Adresse", type: "email" as const, required: true },
    { key: "datenschutz", label: "Ich habe die Datenschutzhinweise gelesen und stimme der Verarbeitung meiner Daten zu.", type: "checkbox" as const, required: true },
  ];
}
