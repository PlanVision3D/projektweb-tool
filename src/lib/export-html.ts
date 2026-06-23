/**
 * STANDALONE-HTML-EXPORT
 * ----------------------
 * Erzeugt aus einer `ProjectContent` ein in sich geschlossenes HTML-Dokument bzw.
 * einen einbettbaren HTML-Block (inkl. <style> und absoluten Bild-URLs), das sich
 * 1:1 in einen WordPress "Custom HTML"-Block oder ein Elementor "HTML"-Widget
 * einfügen lässt.
 *
 * Design: Wir verwenden dieselben Klassennamen wie das Live-Template
 * (modern.module.css), präfixen sie aber durchgängig mit `pvx-`, damit das
 * fremde WordPress-Theme die Seite nicht verfälscht (und umgekehrt). Die rohe
 * CSS-Datei wird eingelesen, gescoped und inline eingebettet.
 *
 * Interaktivität (Tabs, Slider, Menü) wird mit etwas Vanilla-JS nachgebaut –
 * ohne JS bleibt die Seite vollständig lesbar (erstes Geschoss / erstes Bild).
 */
import { promises as fs } from "fs";
import path from "path";
import type { ProjectContent, MediaImage, Unit } from "@/types/content";

const PFX = "pvx-";

/**
 * Icon-Pfade als reine SVG-Strings (gespiegelt aus templates/modern/icons.tsx).
 * Bewusst dupliziert, da `react-dom/server` in dieser Server-Bibliothek von
 * Next nicht erlaubt ist (Build-Regel).
 */
const ICON_PATHS: Record<string, string> = {
  tree: `<path d="M12 22v-7"/><path d="M9 9a3 3 0 0 1 6 0M7.5 14a4.5 4.5 0 0 1 1-8.9 5 5 0 0 1 9.9 0A4.5 4.5 0 0 1 16.5 14Z"/>`,
  leaf: `<path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 16-9 0 12-5 16-9 16Z"/><path d="M4 20c3-4 7-7 13-9"/>`,
  energy: `<path d="M13 2 4 14h7l-1 8 9-12h-7Z"/>`,
  accessible: `<circle cx="12" cy="4" r="1.6"/><path d="M9 8h6M11 7v6h5l2 5M8 11a4 4 0 1 0 5 6"/>`,
  "accessible-partial": `<circle cx="12" cy="4" r="1.6"/><path d="M10 7v6h5M9.5 10a4 4 0 1 0 5 6"/>`,
  parking: `<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 17V8h3.5a2.5 2.5 0 0 1 0 5H9"/>`,
  carport: `<path d="M3 11 12 5l9 6"/><path d="M5 11v8h14v-8"/><path d="M8 19v-4h8v4"/>`,
  connected: `<circle cx="6" cy="6" r="2.2"/><circle cx="18" cy="18" r="2.2"/><path d="M8 7.5 16 16.5M6 8.2v3M18 12.8v3"/>`,
  train: `<rect x="5" y="3" width="14" height="13" rx="3"/><path d="M5 11h14M9 16l-2 4M15 16l2 4"/><circle cx="8.5" cy="13.5" r="0.6"/><circle cx="15.5" cy="13.5" r="0.6"/>`,
  money: `<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9v6M18 9v6"/>`,
  "money-off": `<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="m4 4 16 16"/>`,
  ev: `<rect x="4" y="3" width="11" height="18" rx="2"/><path d="M8 8l-1 3h2l-1 3M18 9v5a2 2 0 0 0 2 2 2 2 0 0 0 0-4h-3"/>`,
  central: `<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>`,
  water: `<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/>`,
  smart: `<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="9" r="2.5"/><path d="M9 16h6"/>`,
  light: `<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>`,
  concept: `<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12"/>`,
  openspace: `<path d="M3 21V8l9-5 9 5v13"/><path d="M3 14h18M11 8h2"/>`,
  atmosphere: `<path d="m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8Z"/><path d="M18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9Z"/>`,
  city: `<path d="M3 21h18M5 21V7l6-4 6 4v14"/><path d="M9 9h.01M13 9h.01M9 13h.01M13 13h.01M9 17h.01M13 17h.01"/>`,
  castle: `<path d="M4 21V9l2 1V6l2 1V4l4-1 4 1v3l2-1v4l2-1v12"/><path d="M10 21v-4a2 2 0 0 1 4 0v4"/>`,
  cart: `<circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/><path d="M2 3h3l2.5 12h9L19 7H6"/>`,
  forest: `<path d="M8 22v-4M16 22v-3"/><path d="M5 14 8 7l3 7H5ZM13 13l3-7 3 7h-6Z"/>`,
  pin: `<path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/>`,
  home: `<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>`,
  building: `<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01M10 21v-3h4v3"/>`,
  person: `<circle cx="12" cy="8" r="3.4"/><path d="M5 20a7 7 0 0 1 14 0"/>`,
  phone: `<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L20 13l-1 4a2 2 0 0 1-2 1.6A15 15 0 0 1 3.4 6 2 2 0 0 1 5 4Z"/>`,
  mail: `<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>`,
  document: `<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>`,
  shield: `<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6Z"/><path d="m9 12 2 2 4-4"/>`,
  globe: `<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.5 6 3.5 9S14.5 18.5 12 21c-2.5-2.5-3.5-6-3.5-9S9.5 5.5 12 3Z"/>`,
  calendar: `<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01"/>`,
};

const STATUS_LABEL: Record<Unit["status"], string> = {
  verfuegbar: "✅ Verfügbar", reserviert: "⏳ Reserviert", vermietet: "🔒 Vermietet", verkauft: "🔒 Verkauft",
};
const STATUS_CLASS: Record<Unit["status"], string> = {
  verfuegbar: "badgeOk", reserviert: "badgeRes", vermietet: "badgeOut", verkauft: "badgeOut",
};
const euro = (n: number | null) =>
  n === null ? "auf Anfrage" : n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

/* ----------------------------- Helfer ----------------------------- */

const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** mehrere lokale Klassennamen → "pvx-a pvx-b" */
const cx = (...names: (string | false | undefined)[]) =>
  names.filter(Boolean).map((n) => PFX + n).join(" ");

function makeAbs(origin: string) {
  return (u?: string) => {
    if (!u) return "";
    if (/^(https?:)?\/\//.test(u) || u.startsWith("data:") || u.startsWith("mailto:") || u.startsWith("tel:")) return u;
    if (u.startsWith("/")) return origin + u;
    return u;
  };
}

function icon(name?: string) {
  const p = name ? ICON_PATHS[name] : undefined;
  if (!p) return "";
  return `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}

/** CSS aus modern.module.css einlesen und alle Klassen mit pvx- präfixen. */
async function scopedCss(): Promise<string> {
  const file = path.join(process.cwd(), "src", "templates", "modern", "modern.module.css");
  let raw = await fs.readFile(file, "utf8");

  // url(...) Inhalte (Daten-SVG) schützen, damit Punkte darin nicht als Klassen gelten
  const urls: string[] = [];
  raw = raw.replace(/url\(([^)]*)\)/g, (m) => { urls.push(m); return `__PVXURL${urls.length - 1}__`; });

  // alle Klassennamen sammeln (Punkt gefolgt von Buchstabe/Unterstrich)
  const names = new Set<string>();
  for (const m of raw.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)) names.add(m[1]);

  // längste zuerst ersetzen, damit .in nicht .inner zerstört
  for (const name of [...names].sort((a, b) => b.length - a.length)) {
    const re = new RegExp("\\." + name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") + "(?![\\w-])", "g");
    raw = raw.replace(re, "." + PFX + name);
  }

  raw = raw.replace(/__PVXURL(\d+)__/g, (_, i) => urls[+i]);
  return raw;
}

/* ----------------------------- Bausteine ----------------------------- */

function slider(images: MediaImage[], abs: (u?: string) => string, id: string) {
  if (!images.length) return "";
  const slides = images
    .map((im, n) => `<img src="${esc(abs(im.url))}" alt="${esc(im.caption || im.alt || "")}" data-n="${n}" class="${cx("eslide", n === 0 && "eslideOn")}" />`)
    .join("");
  const multi = images.length > 1;
  const arrows = multi
    ? `<button type="button" class="${cx("sliderArrow", "sliderPrev")}" data-dir="-1" aria-label="Vorheriges Bild">‹</button>` +
      `<button type="button" class="${cx("sliderArrow", "sliderNext")}" data-dir="1" aria-label="Nächstes Bild">›</button>`
    : "";
  const dots = multi
    ? `<div class="${cx("sliderDots")}">${images
        .map((_, n) => `<button type="button" class="${cx("dot", n === 0 && "dotActive")}" data-n="${n}" aria-label="Bild ${n + 1}"></button>`)
        .join("")}</div>`
    : "";
  const cap0 = images[0].caption || "";
  return (
    `<div class="${cx("slider", "eslider")}" id="${id}">` +
    `<div class="${cx("sliderStage")}">${slides}${arrows}` +
    `<div class="${cx("sliderCaption")}" data-cap${cap0 ? "" : " hidden"}>${esc(cap0)}</div></div>` +
    `${dots}</div>`
  );
}

function badge(text: string, solid = false) {
  return `<span class="${cx("badge", solid ? "badgeSolid" : "badgeOutline")}">${solid ? "" : `<span class="${cx("badgeDot")}"></span>`}${esc(text)}</span>`;
}
const divider = () => `<div class="${cx("divider")}"><span></span></div>`;

/* ----------------------------- Hauptfunktion ----------------------------- */

export async function buildExportHtml(
  content: ProjectContent,
  opts: { origin: string; slug?: string; projectName?: string }
): Promise<string> {
  const abs = makeAbs(opts.origin);
  const { branding, hero, intro, usps, features, units, virtualTour, location, gallery, process, faq, contact, legal } = content;
  const rootId = "pvxapp";
  const anfrage = opts.slug ? `${opts.origin}/site/${opts.slug}/anfrage` : "#kontakt";

  const cta = (label?: string) =>
    `<a class="${cx("btn", "btnGreen")}" href="${esc(anfrage)}"><span class="${cx("btnArrow")}">➜</span> ${esc(label || hero.ctaText || "Jetzt anfragen!")}</a>`;

  const themeVars = [
    `--primary:${esc(branding.primaryColor)}`,
    `--secondary:${esc(branding.secondaryColor)}`,
    `--cta:${esc(branding.ctaColor || "#6f9a3c")}`,
    `--badge:${esc(branding.badgeColor || "#b56a43")}`,
    `--font-head:"${branding.font && branding.font !== "Poppins" ? esc(branding.font) : "Cormorant Garamond"}", Georgia, serif`,
  ].join(";");

  const navLinks: [string, string][] = [
    ["#projekt", "Projekt"], ["#besonderheiten", "Besonderheiten"], ["#wohnungsfinder", "Wohnungsfinder"],
    ["#rundgang", "Virtueller Rundgang"], ["#lage", "Lage"], ["#ablauf", "Ablauf"], ["#faq", "FAQ"], ["#kontakt", "Kontakt"],
  ];

  const floors = units.floors.length ? units.floors : [...new Set(units.items.map((u) => u.floor))];

  /* ---------- Sektionen ---------- */
  const parts: string[] = [];

  // HEADER
  parts.push(
    `<header class="${cx("header")}" data-header>` +
      `<div class="${cx("container", "headerInner")}">` +
        `<button type="button" class="${cx("burger")}" data-menu-open aria-label="Menü öffnen"><span></span><span></span><span></span></button>` +
        `<a class="${cx("logo")}" href="#hero">` +
          (branding.logoUrl
            ? `<img src="${esc(abs(branding.logoUrl))}" alt="${esc(intro.projectName)}" />`
            : `<span class="${cx("logoFallback")}">🏠 ${esc(intro.projectName || "Projekt")}</span>`) +
        `</a>` +
        `<div class="${cx("headerCta")}"><a class="${cx("btn", "btnGold")}" href="${esc(anfrage)}">Termin vereinbaren</a></div>` +
      `</div></header>`
  );

  // MENU OVERLAY
  parts.push(
    `<div class="${cx("menuOverlay")}" data-menu>` +
      `<button type="button" class="${cx("menuClose")}" data-menu-close aria-label="Menü schließen">×</button>` +
      navLinks.map(([h, l]) => `<a href="${h}" data-menu-link>${esc(l)}</a>`).join("") +
      `<a href="${esc(anfrage)}" data-menu-link style="margin-top:1rem">📅 Termin vereinbaren</a>` +
    `</div>`
  );

  // HERO
  parts.push(
    `<section class="${cx("hero")}" id="hero">` +
      `<div class="${cx("heroBg")}" style="background-image:${hero.image ? `url(${esc(abs(hero.image.url))})` : "linear-gradient(135deg,#3a4a63,#2a3548)"}"></div>` +
      `<div class="${cx("heroInner")}"><div class="${cx("heroContent")}">` +
        (hero.label ? `<div class="${cx("heroBadge")}">${badge(hero.label, true)}</div>` : "") +
        `<h1>${esc(hero.headline)}</h1>` +
        (hero.subheadline ? `<p class="${cx("heroSub")}">${esc(hero.subheadline)}</p>` : "") +
        cta() +
        (hero.facts.length
          ? `<div class="${cx("heroFacts")}">${hero.facts.map((f) => `<div class="${cx("fact")}">${esc(f.value ? `${f.label}: ${f.value}` : f.label)}</div>`).join("")}</div>`
          : "") +
      `</div></div>` +
    `</section>`
  );

  // PROJEKT
  parts.push(
    `<section class="${cx("section", "leafBg")}" id="projekt"><div class="${cx("container", "projektGrid")}">` +
      `<div class="${cx("projektText")}">${badge("Das Projekt")}<h2>${esc(intro.projectName)}</h2>` +
        intro.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("") +
        (intro.facts.length
          ? `<ul class="${cx("checkList")}">${intro.facts.map((f) => `<li class="${cx("checkItem")}"><span class="${cx("checkDot")}">✓</span>${esc(f.value || f.label)}</li>`).join("")}</ul>`
          : "") +
        cta() +
      `</div>` +
      `<div>${intro.images.length ? slider(intro.images, abs, `${rootId}-intro`) : hero.image ? `<img src="${esc(abs(hero.image.url))}" alt="" style="width:100%;border-radius:16px" />` : ""}</div>` +
    `</div></section>`
  );

  // USPs
  if (usps.length) {
    parts.push(
      `<section class="${cx("section", "uspSection", "leafBg", "leafBgLight")}"><div class="${cx("container")}">` +
        usps
          .map((u, i) =>
            `<div class="${cx("uspBlock", i % 2 === 1 && "uspBlockRev")}">` +
              `<div class="${cx("uspImgWrap")}">${u.image ? `<img src="${esc(abs(u.image.url))}" alt="${esc(u.title)}" />` : `<div style="height:540px;background:rgba(255,255,255,.1)"></div>`}</div>` +
              `<div class="${cx("uspBody")}"><div class="${cx("uspNo")}">${String(i + 1).padStart(2, "0")}</div><h3>${esc(u.title)}</h3><p>${esc(u.text)}</p></div>` +
            `</div>`
          )
          .join("") +
      `</div></section>`
    );
  }

  // FEATURES
  if (features.length) {
    parts.push(
      `<section class="${cx("section", "leafBg")}" id="besonderheiten"><div class="${cx("container")}">` +
        `<div class="${cx("head")}">${badge("Highlights")}<h2>Besonderheiten</h2></div>` +
        `<div class="${cx("featureGrid")}">` +
          features
            .map((f) =>
              `<div class="${cx("feature")}">` +
                (f.iconKey ? `<div class="${cx("featureIcon")}">${icon(f.iconKey)}</div>` : f.icon ? `<span class="${cx("featureEmoji")}">${esc(f.icon)}</span>` : "") +
                `<h4>${esc(f.title)}</h4><p>${esc(f.text)}</p>` +
              `</div>`
            )
            .join("") +
        `</div><div style="margin-top:40px">${cta()}</div>` +
      `</div></section>`
    );
  }

  // WOHNUNGSFINDER (statisches Bild)
  const finderImg = units.navigator
    ? units.navigator.artboards.find((a) => a.id === units.navigator!.rootId)?.image.url
    : units.buildingImage?.url;
  if (units.items.length && finderImg) {
    parts.push(
      `<section class="${cx("section", "tintSection", "leafBg")}" id="wohnungsfinder"><div class="${cx("container")}">` +
        `<div class="${cx("head")}">${badge("Die Wohnungen")}<h2>Wohnungsfinder</h2>${units.intro ? `<p class="${cx("lead")}">${esc(units.intro)}</p>` : ""}</div>` +
        `<div class="${cx("navWrap")}"><img class="${cx("navImage")}" src="${esc(abs(finderImg))}" alt="Gebäude" /></div>` +
      `</div></section>`
    );
  }

  // PREISE (Tabs über alle Geschosse)
  if (units.items.length) {
    const tabs = floors
      .map((f, i) => `<button type="button" class="${cx("tab", i === 0 && "tabActive")}" data-floor-tab="${i}">${esc(f)}</button>`)
      .join("");
    const panes = floors
      .map((f, i) => {
        const rows = units.items
          .filter((u) => u.floor === f)
          .map(
            (u) =>
              `<tr><td><strong>${esc(u.name)}</strong></td><td>${esc(u.floor)}</td><td>${esc(u.area)}</td><td>${esc(u.rooms)}</td>` +
              `<td class="${cx("price")}">${esc(u.priceLabel || euro(u.price))}</td><td>${esc(u.extra)}</td>` +
              `<td><span class="${cx("sbadge", STATUS_CLASS[u.status])}">${STATUS_LABEL[u.status]}</span></td></tr>`
          )
          .join("");
        return (
          `<div class="${cx("floorPane", i === 0 && "floorPaneOn")}" data-floor-pane="${i}"><div class="${cx("tableWrap")}">` +
            `<table class="${cx("units")}"><thead><tr><th>Wohnung</th><th>Geschoss</th><th>Fläche</th><th>Art</th><th>Mietpreis</th><th>Besonderheit</th><th>Status</th></tr></thead>` +
            `<tbody>${rows}</tbody></table></div></div>`
        );
      })
      .join("");
    parts.push(
      `<section class="${cx("section", "leafBg")}" id="preise"><div class="${cx("container")}">` +
        `<div class="${cx("head")}">${badge("Die Wohnungen")}<h2>Verfügbarkeit und Preise</h2></div>` +
        `<div class="${cx("priceCard")}"><div class="${cx("tabs")}">${tabs}</div>${panes}</div>` +
        (units.note ? `<p class="${cx("hint")}">${esc(units.note)}</p>` : "") +
      `</div></section>`
    );
  }

  parts.push(divider());

  // RUNDGANG
  if (virtualTour.embedUrl || virtualTour.images.length) {
    parts.push(
      `<section class="${cx("section")}" id="rundgang"><div class="${cx("container")}">` +
        `<div class="${cx("head")}">${badge(virtualTour.subheading || "Musterwohnung")}<h2>${esc(virtualTour.heading || "Virtueller Rundgang")}</h2>${virtualTour.description ? `<p class="${cx("lead")}">${esc(virtualTour.description)}</p>` : ""}</div>` +
        (virtualTour.embedUrl
          ? `<div class="${cx("tourEmbed")}"><iframe src="${esc(virtualTour.embedUrl)}" title="Virtueller Rundgang" allowfullscreen loading="lazy"></iframe></div>`
          : slider(virtualTour.images, abs, `${rootId}-tour`)) +
      `</div></section>`
    );
  }

  // GALERIE
  if (gallery.length) {
    parts.push(
      `<section class="${cx("section", "gallerySection", "leafBg", "leafBgLight")}" id="galerie"><div class="${cx("container")}">` +
        `<div class="${cx("head")}">${badge("Einblicke", true)}<h2>Innenraum-Visualisierungen</h2><p class="${cx("lead")}">Hochwertige Visualisierungen Ihrer zukünftigen Wohnräume.</p></div>` +
        slider(gallery, abs, `${rootId}-gallery`) +
      `</div></section>`
    );
  }

  // LAGE
  parts.push(
    `<section class="${cx("section", "leafBg")}" id="lage"><div class="${cx("container")}">` +
      `<div class="${cx("head")}">${badge("Lage")}<h2>Standort der Immobilie</h2></div>` +
      `<div class="${cx("lageGrid")}"><div>` +
        `<h3 style="color:${esc(branding.primaryColor)};margin-bottom:.6rem;font-size:1.5rem">${esc(location.address)}</h3>` +
        (location.description ? `<p class="${cx("lead")}">${esc(location.description)}</p>` : "") +
        (location.advantages.length
          ? `<ul class="${cx("locList")}">${location.advantages.map((a) => `<li class="${cx("locItem")}"><span class="${cx("locIcon")}">${a.iconKey ? icon(a.iconKey) : esc(a.icon || "")}</span>${esc(a.text)}</li>`).join("")}</ul>`
          : "") +
      `</div>` +
      (location.mapEmbedUrl ? `<div class="${cx("map")}"><iframe title="Karte" loading="lazy" src="${esc(location.mapEmbedUrl)}"></iframe></div>` : "") +
    `</div></div></section>`
  );

  parts.push(divider());

  // ABLAUF
  if (process.length) {
    parts.push(
      `<section class="${cx("section", "leafBg")}" id="ablauf"><div class="${cx("container")}">` +
        `<div class="${cx("head")}">${badge("Ablauf")}<h2>Ihr Weg ins neue Zuhause</h2></div>` +
        `<div class="${cx("steps")}">` +
          process.map((p, i) => `<div class="${cx("step")}"><span class="${cx("stepNo")}">${String(i + 1).padStart(2, "0")}</span><h4>${esc(p.title)}</h4><p>${esc(p.description)}</p></div>`).join("") +
        `</div>` +
        `<div class="${cx("ablaufCta")}"><div class="${cx("ablaufCtaIco")}">${icon("calendar")}</div><div>` +
          `<h3>Bereit für Ihr neues Zuhause?</h3><p>Vereinbaren Sie jetzt unverbindlich einen Termin – wir beraten Sie persönlich und provisionsfrei.</p>` +
          `<a class="${cx("btn")}" href="${esc(anfrage)}"><span class="${cx("btnArrow")}">➜</span> Termin vereinbaren</a>` +
        `</div></div>` +
      `</div></section>`
    );
  }

  parts.push(divider());

  // FAQ + KONTAKT
  parts.push(
    `<section class="${cx("section", "leafBg")}" id="faq"><div class="${cx("container")}">` +
      `<div class="${cx("head", "headLeft")}">${badge("Kontakt und FAQs")}<h2>Häufig gestellte Fragen</h2></div>` +
      `<div class="${cx("faqContactGrid")}" id="kontakt"><div class="${cx("contactCard")}">` +
        (branding.logoUrl ? `<img class="${cx("contactLogo")}" src="${esc(abs(branding.logoUrl))}" alt="${esc(intro.projectName)}" />` : "") +
        `<ul class="${cx("contactList")}">` +
          (legal.companyName ? `<li><span class="${cx("contactIco")}">${icon("building")}</span>${esc(legal.companyName)}</li>` : "") +
          (contact.persons[0]?.name ? `<li><span class="${cx("contactIco")}">${icon("person")}</span>${esc(contact.persons[0].name)}</li>` : "") +
          (contact.persons[0]?.phone ? `<li><span class="${cx("contactIco")}">${icon("phone")}</span><a href="tel:${esc(contact.persons[0].phone.replace(/\s/g, ""))}">${esc(contact.persons[0].phone)}</a></li>` : "") +
          (contact.persons[0]?.email ? `<li><span class="${cx("contactIco")}">${icon("mail")}</span><a href="mailto:${esc(contact.persons[0].email)}">${esc(contact.persons[0].email)}</a></li>` : "") +
        `</ul>` +
        `<a class="${cx("btn", "btnGreen")}" href="${esc(anfrage)}"><span class="${cx("btnArrow")}">➜</span> Jetzt anfragen!</a>` +
      `</div>` +
      `<div class="${cx("faqList")}">${faq.map((f) => `<details><summary>${esc(f.question)}</summary><p>${esc(f.answer)}</p></details>`).join("")}</div>` +
    `</div></div></section>`
  );

  // FOOTER
  parts.push(
    `<footer class="${cx("footer")}" id="impressum"><div class="${cx("container")}">` +
      `<div class="${cx("footerHead")}"><span class="${cx("footerBadge")}">Kontakt &amp; Rechtliches</span><h2>Alle Informationen auf einen Blick</h2><p>Anschrift, Kontaktmöglichkeiten und rechtliche Hinweise kompakt zusammengefasst.</p></div>` +
      `<div class="${cx("footerCards")}">` +
        `<div class="${cx("fCard")}"><span class="${cx("fCardLabel")}">Adresse</span>` +
          `<div class="${cx("fRow")}"><span class="${cx("fIco")}">${icon("building")}</span><div class="${cx("fRowText")}"><span>Unternehmen</span><strong>${esc(legal.companyName)}</strong></div></div>` +
          `<div class="${cx("fRow")}"><span class="${cx("fIco")}">${icon("pin")}</span><div class="${cx("fRowText")}"><span>Straße / Adresse</span><strong>${esc(legal.street)}</strong></div></div>` +
          `<div class="${cx("fRow")}"><span class="${cx("fIco")}">${icon("globe")}</span><div class="${cx("fRowText")}"><span>PLZ und Ort</span><strong>${esc(legal.cityZip)}</strong></div></div>` +
        `</div>` +
        `<div class="${cx("fCard")}"><span class="${cx("fCardLabel")}">Kontakt</span>` +
          (legal.representedBy ? `<div class="${cx("fRow")}"><span class="${cx("fIco")}">${icon("person")}</span><div class="${cx("fRowText")}"><span>Vertreten durch</span><strong>${esc(legal.representedBy)}</strong></div></div>` : "") +
          (legal.phone ? `<div class="${cx("fRow")}"><span class="${cx("fIco")}">${icon("phone")}</span><div class="${cx("fRowText")}"><span>Telefon</span><strong><a href="tel:${esc(legal.phone.replace(/\s/g, ""))}">${esc(legal.phone)}</a></strong></div></div>` : "") +
          (legal.email ? `<div class="${cx("fRow")}"><span class="${cx("fIco")}">${icon("mail")}</span><div class="${cx("fRowText")}"><span>E-Mail</span><strong><a href="mailto:${esc(legal.email)}">${esc(legal.email)}</a></strong></div></div>` : "") +
        `</div>` +
        `<div class="${cx("fCard")}"><span class="${cx("fCardLabel")}">Rechtliches</span>` +
          `<a class="${cx("fRow", "fLegalRow")}" href="#impressum"><span class="${cx("fIco")}">${icon("document")}</span><div class="${cx("fRowText")}"><strong>Impressum</strong></div></a>` +
          `<a class="${cx("fRow", "fLegalRow")}" href="#datenschutz"><span class="${cx("fIco")}">${icon("shield")}</span><div class="${cx("fRowText")}"><strong>Datenschutz</strong></div></a>` +
        `</div>` +
      `</div>` +
      `<div class="${cx("footerBottom")}"><span>© ${new Date().getFullYear()} ${esc(legal.companyName)}</span><span>Alle Rechte vorbehalten.</span></div>` +
    `</div></footer>`
  );

  /* ---------- Lightbox + CSS + JS ---------- */
  const lightbox = `<div class="${cx("lightbox")}" data-lightbox hidden><button type="button" class="${cx("lbClose")}" data-lb-close aria-label="Schließen">×</button><figure class="${cx("lbFigure")}"><img alt="" /></figure></div>`;

  const baseCss = await scopedCss();
  const exportCss = `
.${PFX}root{font-size:18px}
.${PFX}root,.${PFX}root *{box-sizing:border-box}
.${PFX}root img{max-width:100%}
.${PFX}root p,.${PFX}root h1,.${PFX}root h2,.${PFX}root h3,.${PFX}root h4,.${PFX}root ul{margin:0}
.${PFX}root a{color:inherit}
/* Geschoss-Tabs */
.${PFX}floorPane{display:none}
.${PFX}floorPane.${PFX}floorPaneOn{display:block}
/* Slider: ein Bild sichtbar */
.${PFX}eslide{display:none}
.${PFX}eslide.${PFX}eslideOn{display:block}
.${PFX}sliderZoom,.${PFX}eslide{cursor:zoom-in}
[hidden]{display:none!important}`;

  const js = `(function(){
  var R=document.getElementById("${rootId}");if(!R)return;
  // Header beim Scrollen verdichten
  var H=R.querySelector("[data-header]");
  function onScroll(){if(H)H.classList.toggle("${PFX}headerScrolled",window.scrollY>60);}
  onScroll();window.addEventListener("scroll",onScroll,{passive:true});
  // Menü
  var M=R.querySelector("[data-menu]");
  function setMenu(o){if(M)M.classList.toggle("${PFX}open",o);}
  R.querySelectorAll("[data-menu-open]").forEach(function(b){b.addEventListener("click",function(){setMenu(true);});});
  R.querySelectorAll("[data-menu-close],[data-menu-link]").forEach(function(b){b.addEventListener("click",function(){setMenu(false);});});
  // Preis-Tabs
  R.querySelectorAll("[data-floor-tab]").forEach(function(t){t.addEventListener("click",function(){
    var i=t.getAttribute("data-floor-tab"),card=t.closest(".${PFX}priceCard");
    card.querySelectorAll("[data-floor-tab]").forEach(function(x){x.classList.toggle("${PFX}tabActive",x===t);});
    card.querySelectorAll("[data-floor-pane]").forEach(function(p){p.classList.toggle("${PFX}floorPaneOn",p.getAttribute("data-floor-pane")===i);});
  });});
  // Slider
  var LB=R.querySelector("[data-lightbox]"),LBimg=LB?LB.querySelector("img"):null;
  function openLB(src,alt){if(!LB)return;LBimg.src=src;LBimg.alt=alt||"";LB.hidden=false;}
  if(LB){LB.addEventListener("click",function(){LB.hidden=true;LBimg.src="";});}
  R.querySelectorAll(".${PFX}eslider").forEach(function(S){
    var slides=[].slice.call(S.querySelectorAll(".${PFX}eslide")),dots=[].slice.call(S.querySelectorAll(".${PFX}dot")),cap=S.querySelector("[data-cap]"),i=0;
    function show(n){i=(n+slides.length)%slides.length;slides.forEach(function(s,k){s.classList.toggle("${PFX}eslideOn",k===i);});dots.forEach(function(d,k){d.classList.toggle("${PFX}dotActive",k===i);});if(cap){var c=slides[i].getAttribute("alt")||"";cap.textContent=c;cap.hidden=!c;}}
    S.querySelectorAll(".${PFX}sliderArrow").forEach(function(a){a.addEventListener("click",function(){show(i+parseInt(a.getAttribute("data-dir"),10));});});
    dots.forEach(function(d){d.addEventListener("click",function(){show(parseInt(d.getAttribute("data-n"),10));});});
    slides.forEach(function(s){s.addEventListener("click",function(){openLB(s.src,s.getAttribute("alt"));});});
    if(slides.length)show(0);
  });
})();`;

  const isFragment = false; // ganzes Dokument
  const body =
    `<div id="${rootId}" class="${cx("root")}" style='${themeVars}'>` +
    parts.join("\n") +
    lightbox +
    `</div>` +
    `<script>${js}</script>`;

  return (
    `<!doctype html>\n<html lang="de">\n<head>\n` +
    `<meta charset="utf-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1" />\n` +
    `<title>${esc(content.seo.title || intro.projectName || opts.projectName || "Projekt")}</title>\n` +
    `<meta name="description" content="${esc(content.seo.description || "")}" />\n` +
    `<link rel="preconnect" href="https://fonts.googleapis.com" />\n` +
    `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n` +
    `<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />\n` +
    `<style>\n${baseCss}\n${exportCss}\n</style>\n` +
    `</head>\n<body style="margin:0">\n${body}\n</body>\n</html>`
  );
}
