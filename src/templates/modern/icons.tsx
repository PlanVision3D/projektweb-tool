import type { CSSProperties } from "react";

/**
 * Icon-Bibliothek (Lucide-Stil, stroke="currentColor").
 * Wird für Besonderheiten und Lage-Vorteile verwendet – im Editor wählbar.
 */
const P: Record<string, JSX.Element> = {
  tree: <><path d="M12 22v-7" /><path d="M9 9a3 3 0 0 1 6 0M7.5 14a4.5 4.5 0 0 1 1-8.9 5 5 0 0 1 9.9 0A4.5 4.5 0 0 1 16.5 14Z" /></>,
  leaf: <><path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 16-9 0 12-5 16-9 16Z" /><path d="M4 20c3-4 7-7 13-9" /></>,
  energy: <><path d="M13 2 4 14h7l-1 8 9-12h-7Z" /></>,
  accessible: <><circle cx="12" cy="4" r="1.6" /><path d="M9 8h6M11 7v6h5l2 5M8 11a4 4 0 1 0 5 6" /></>,
  "accessible-partial": <><circle cx="12" cy="4" r="1.6" /><path d="M10 7v6h5M9.5 10a4 4 0 1 0 5 6" /></>,
  parking: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 17V8h3.5a2.5 2.5 0 0 1 0 5H9" /></>,
  carport: <><path d="M3 11 12 5l9 6" /><path d="M5 11v8h14v-8" /><path d="M8 19v-4h8v4" /></>,
  connected: <><circle cx="6" cy="6" r="2.2" /><circle cx="18" cy="18" r="2.2" /><path d="M8 7.5 16 16.5M6 8.2v3M18 12.8v3" /></>,
  train: <><rect x="5" y="3" width="14" height="13" rx="3" /><path d="M5 11h14M9 16l-2 4M15 16l2 4" /><circle cx="8.5" cy="13.5" r="0.6" /><circle cx="15.5" cy="13.5" r="0.6" /></>,
  money: <><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 9v6M18 9v6" /></>,
  "money-off": <><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="m4 4 16 16" /></>,
  ev: <><rect x="4" y="3" width="11" height="18" rx="2" /><path d="M8 8l-1 3h2l-1 3M18 9v5a2 2 0 0 0 2 2 2 2 0 0 0 0-4h-3" /></>,
  central: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2.5" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3" /></>,
  water: <><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" /></>,
  smart: <><rect x="4" y="3" width="16" height="18" rx="2" /><circle cx="12" cy="9" r="2.5" /><path d="M9 16h6" /></>,
  light: <><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></>,
  concept: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 9v12" /></>,
  openspace: <><path d="M3 21V8l9-5 9 5v13" /><path d="M3 14h18M11 8h2" /></>,
  atmosphere: <><path d="m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8Z" /><path d="M18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9Z" /></>,
  city: <><path d="M3 21h18M5 21V7l6-4 6 4v14" /><path d="M9 9h.01M13 9h.01M9 13h.01M13 13h.01M9 17h.01M13 17h.01" /></>,
  castle: <><path d="M4 21V9l2 1V6l2 1V4l4-1 4 1v3l2-1v4l2-1v12" /><path d="M10 21v-4a2 2 0 0 1 4 0v4" /></>,
  cart: <><circle cx="9" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" /><path d="M2 3h3l2.5 12h9L19 7H6" /></>,
  forest: <><path d="M8 22v-4M16 22v-3" /><path d="M5 14 8 7l3 7H5ZM13 13l3-7 3 7h-6Z" /></>,
  pin: <><path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" /><circle cx="12" cy="10" r="2.5" /></>,
  home: <><path d="M3 11 12 4l9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></>,
  building: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01M10 21v-3h4v3" /></>,
  person: <><circle cx="12" cy="8" r="3.4" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
  phone: <><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L20 13l-1 4a2 2 0 0 1-2 1.6A15 15 0 0 1 3.4 6 2 2 0 0 1 5 4Z" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  document: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>,
  shield: <><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6Z" /><path d="m9 12 2 2 4-4" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 3.5 6 3.5 9S14.5 18.5 12 21c-2.5-2.5-3.5-6-3.5-9S9.5 5.5 12 3Z" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01" /></>,
};

export const ICON_OPTIONS: { key: string; label: string }[] = [
  { key: "tree", label: "Baum / Naturnah" },
  { key: "leaf", label: "Blatt / Nachhaltig" },
  { key: "energy", label: "Energie / Blitz" },
  { key: "accessible", label: "Barrierefrei" },
  { key: "accessible-partial", label: "Barrierearm" },
  { key: "parking", label: "Parken (P)" },
  { key: "carport", label: "Carport / Stellplatz" },
  { key: "connected", label: "Vernetzt" },
  { key: "train", label: "Bahn / ÖPNV" },
  { key: "money-off", label: "Provisionsfrei" },
  { key: "ev", label: "E-Ladestation" },
  { key: "central", label: "Zentral" },
  { key: "water", label: "Am Wasser" },
  { key: "smart", label: "Smart Home" },
  { key: "light", label: "Helle Räume" },
  { key: "concept", label: "Wohnkonzept" },
  { key: "openspace", label: "Open Space" },
  { key: "atmosphere", label: "Atmosphäre / Wohngefühl" },
  { key: "city", label: "Innenstadt / Zentral" },
  { key: "castle", label: "Schloss" },
  { key: "cart", label: "Einkaufen" },
  { key: "forest", label: "Wald / Odenwald" },
  { key: "pin", label: "Standort" },
  { key: "home", label: "Haus" },
];

/** Häufige Besonderheiten als Vorlagen (Titel, Text, Icon). */
export const FEATURE_PRESETS: { title: string; text: string; iconKey: string }[] = [
  { title: "Stellplätze", text: "Für jede Wohneinheit können Stellplätze erworben werden.", iconKey: "carport" },
  { title: "Parken", text: "Eigene Stellplätze für direktes Parken am Zuhause.", iconKey: "parking" },
  { title: "Atmosphäre", text: "Wohnräume mit Licht, Komfort und Harmonie.", iconKey: "atmosphere" },
  { title: "Wohnkonzept", text: "Durchdachte Grundrisse für maximale Wohnfläche.", iconKey: "concept" },
  { title: "Open Space", text: "Offener Wohnbereich für gemeinsames Wohlfühlen.", iconKey: "openspace" },
  { title: "Wohngefühl", text: "Wohnräume mit Licht, Komfort und Harmonie.", iconKey: "atmosphere" },
  { title: "Zentral", text: "Gute Anbindung an alle wichtigen Einrichtungen.", iconKey: "central" },
  { title: "Smart Home", text: "Optionale Smart Home Funktionen für Ihr Zuhause.", iconKey: "smart" },
  { title: "Helle Räume", text: "Lichtdurchflutete Räume für modernes Lebensgefühl.", iconKey: "light" },
  { title: "Vernetzt", text: "Schnelle Wege zu Bus, Bahn und Verkehrsachsen.", iconKey: "connected" },
  { title: "Am Wasser", text: "In Wassernähe mit hohem Erholungswert.", iconKey: "water" },
  { title: "Energie", text: "Nachhaltig wohnen, mit geringeren Energie-Kosten.", iconKey: "energy" },
  { title: "Barrierefrei", text: "Barrierefreie Zugänge für maximalen Wohnkomfort.", iconKey: "accessible" },
  { title: "Barrierearm", text: "Teilweise barrierefrei für mehr Wohnkomfort.", iconKey: "accessible-partial" },
  { title: "Naturnah", text: "Idyllisch gelegen, Ruhe & Natur für Entspannung.", iconKey: "tree" },
  { title: "Ohne Provision", text: "Der Verkauf erfolgt intern und provisionsfrei.", iconKey: "money-off" },
];

export default function Icon({ name, className, style }: { name?: string; className?: string; style?: CSSProperties }) {
  const path = name ? P[name] : undefined;
  if (!path) return null;
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {path}
    </svg>
  );
}
