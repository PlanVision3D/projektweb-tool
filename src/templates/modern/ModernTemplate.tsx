"use client";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { ProjectContent, Unit } from "@/types/content";
import styles from "./modern.module.css";
import Slider from "./Slider";
import FloorNavigator from "./FloorNavigator";
import Icon from "./icons";

const STATUS_LABEL: Record<Unit["status"], string> = {
  verfuegbar: "✅ Verfügbar", reserviert: "⏳ Reserviert", vermietet: "🔒 Vermietet", verkauft: "🔒 Verkauft",
};
const STATUS_CLASS: Record<Unit["status"], string> = {
  verfuegbar: styles.badgeOk, reserviert: styles.badgeRes, vermietet: styles.badgeOut, verkauft: styles.badgeOut,
};
const euro = (n: number | null) => (n === null ? "auf Anfrage" : n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €");

const NAV_LINKS = [
  ["#projekt", "Projekt"], ["#besonderheiten", "Besonderheiten"], ["#wohnungsfinder", "Wohnungsfinder"],
  ["#rundgang", "Virtueller Rundgang"], ["#lage", "Lage"], ["#ablauf", "Ablauf"], ["#faq", "FAQ"], ["#kontakt", "Kontakt"],
];

function Badge({ children, solid }: { children: React.ReactNode; solid?: boolean }) {
  return <span className={`${styles.badge} ${solid ? styles.badgeSolid : styles.badgeOutline}`}>{!solid && <span className={styles.badgeDot} />}{children}</span>;
}
function Divider() { return <div className={styles.divider}><span /></div>; }

export default function ModernTemplate({ content, projectId, slug, basePath }: { content: ProjectContent; projectId?: string; slug?: string; basePath?: string }) {
  const { branding, hero, intro, usps, features, units, virtualTour, location, gallery, process, faq, contact, legal } = content;
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  // base bestimmt, wie interne Links gebaut werden:
  //  - Custom Domain: basePath="" -> /anfrage
  //  - Vorschau:      slug gesetzt -> /site/<slug>/anfrage
  const base = basePath !== undefined ? basePath : (slug ? `/site/${slug}` : null);
  const anfrageHref = base !== null ? `${base}/anfrage` : "#kontakt";

  const themeVars = {
    ["--primary" as any]: branding.primaryColor,
    ["--secondary" as any]: branding.secondaryColor,
    ["--cta" as any]: branding.ctaColor || "#6f9a3c",
    ["--badge" as any]: branding.badgeColor || "#b56a43",
    ["--font-head" as any]: `"${branding.font && branding.font !== "Poppins" ? branding.font : "Cormorant Garamond"}", Georgia, serif`,
  } as React.CSSProperties;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const els = rootRef.current?.querySelectorAll(`.${styles.reveal}`);
    const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add(styles.in); io.unobserve(e.target); } }), { threshold: 0.12 });
    els?.forEach((el) => io.observe(el));
    return () => { window.removeEventListener("scroll", onScroll); io.disconnect(); };
  }, []);

  const floors = units.floors.length ? units.floors : Array.from(new Set(units.items.map((u) => u.floor)));
  const [activeFloor, setActiveFloor] = useState(floors[0] ?? "");
  const floorRows = useMemo(() => units.items.filter((u) => u.floor === activeFloor), [units.items, activeFloor]);

  const Cta = ({ label }: { label?: string }) => (
    <a className={`${styles.btn} ${styles.btnGreen}`} href={anfrageHref}><span className={styles.btnArrow}>➜</span> {label || hero.ctaText || "Jetzt anfragen!"}</a>
  );

  return (
    <div className={styles.root} style={themeVars} ref={rootRef}>
      {/* HEADER */}
      <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ""}`}>
        <div className={`${styles.container} ${styles.headerInner}`}>
          <button className={styles.burger} aria-label="Menü öffnen" onClick={() => setMenuOpen(true)}><span /><span /><span /></button>
          <a className={styles.logo} href="#hero">
            {branding.logoUrl ? <img src={branding.logoUrl} alt={intro.projectName} /> : <span className={styles.logoFallback}>🏠 {intro.projectName || "Projekt"}</span>}
          </a>
          <div className={styles.headerCta}><a className={`${styles.btn} ${styles.btnGold}`} href={anfrageHref}>Termin vereinbaren</a></div>
        </div>
      </header>

      <div className={`${styles.menuOverlay} ${menuOpen ? styles.open : ""}`}>
        <button className={styles.menuClose} aria-label="Menü schließen" onClick={() => setMenuOpen(false)}>×</button>
        {NAV_LINKS.map(([href, label]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}
        <a href={anfrageHref} onClick={() => setMenuOpen(false)} style={{ marginTop: "1rem" }}>📅 Termin vereinbaren</a>
      </div>

      {/* HERO */}
      <section className={styles.hero} id="hero">
        <div className={styles.heroBg} style={{ backgroundImage: hero.image ? `url(${hero.image.url})` : "linear-gradient(135deg,#3a4a63,#2a3548)" }} />
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            {hero.label && <div className={styles.heroBadge}><Badge solid>{hero.label}</Badge></div>}
            <h1>{hero.headline}</h1>
            {hero.subheadline && <p className={styles.heroSub}>{hero.subheadline}</p>}
            <Cta />
            {hero.facts.length > 0 && (
              <div className={styles.heroFacts}>{hero.facts.map((f, i) => <div key={i} className={styles.fact}>{f.value ? `${f.label}: ${f.value}` : f.label}</div>)}</div>
            )}
          </div>
        </div>
      </section>

      {/* DAS PROJEKT */}
      <section className={`${styles.section} ${styles.leafBg}`} id="projekt">
        <div className={`${styles.container} ${styles.projektGrid} ${styles.reveal}`}>
          <div className={styles.projektText}>
            <Badge>Das Projekt</Badge>
            <h2>{intro.projectName}</h2>
            {intro.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            {intro.facts.length > 0 && (
              <ul className={styles.checkList}>{intro.facts.map((f, i) => <li key={i} className={styles.checkItem}><span className={styles.checkDot}>✓</span>{f.value || f.label}</li>)}</ul>
            )}
            <Cta />
          </div>
          <div>{intro.images.length > 0 ? <Slider images={intro.images} /> : hero.image && <img src={hero.image.url} alt="" style={{ width: "100%", borderRadius: 16 }} />}</div>
        </div>
      </section>

      {/* USP – Barrierefrei / Naturnah (blau) */}
      {usps.length > 0 && (
        <section className={`${styles.section} ${styles.uspSection} ${styles.leafBg} ${styles.leafBgLight}`}>
          <div className={styles.container}>
            {usps.map((u, i) => (
              <div key={i} className={`${styles.uspBlock} ${i % 2 === 1 ? styles.uspBlockRev : ""} ${styles.reveal}`}>
                <div className={styles.uspImgWrap}>{u.image ? <img src={u.image.url} alt={u.title} /> : <div style={{ height: 540, background: "rgba(255,255,255,.1)" }} />}</div>
                <div className={styles.uspBody}>
                  <div className={styles.uspNo}>{String(i + 1).padStart(2, "0")}</div>
                  <h3>{u.title}</h3><p>{u.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* BESONDERHEITEN */}
      {features.length > 0 && (
        <section className={`${styles.section} ${styles.leafBg}`} id="besonderheiten">
          <div className={styles.container}>
            <div className={`${styles.head} ${styles.reveal}`}><Badge>Highlights</Badge><h2>Besonderheiten</h2></div>
            <div className={`${styles.featureGrid} ${styles.reveal}`}>
              {features.map((f, i) => (
                <div key={i} className={styles.feature}>
                  {f.iconKey ? <div className={styles.featureIcon}><Icon name={f.iconKey} /></div> : f.icon ? <span className={styles.featureEmoji}>{f.icon}</span> : null}
                  <h4>{f.title}</h4><p>{f.text}</p>
                </div>
              ))}
            </div>
            <div className={styles.reveal} style={{ marginTop: 40 }}><Cta /></div>
          </div>
        </section>
      )}

      {/* WOHNUNGSFINDER */}
      {units.items.length > 0 && (
        <section className={`${styles.section} ${styles.tintSection} ${styles.leafBg}`} id="wohnungsfinder">
          <div className={styles.container}>
            <div className={`${styles.head} ${styles.reveal}`}><Badge>Die Wohnungen</Badge><h2>Wohnungsfinder</h2>{units.intro && <p className={styles.lead}>{units.intro}</p>}</div>
            <div className={styles.reveal}>
              {units.navigator ? <FloorNavigator nav={units.navigator} /> : units.buildingImage && <div className={styles.navWrap}><img className={styles.navImage} src={units.buildingImage.url} alt="Gebäude" /></div>}
            </div>
          </div>
        </section>
      )}

      {/* VERFÜGBARKEIT & PREISE (eigene Sektion, Tabs) */}
      {units.items.length > 0 && (
        <section className={`${styles.section} ${styles.leafBg}`} id="preise">
          <div className={styles.container}>
            <div className={`${styles.head} ${styles.reveal}`}><Badge>Die Wohnungen</Badge><h2>Verfügbarkeit und Preise</h2></div>
            <div className={`${styles.priceCard} ${styles.reveal}`}>
              <div className={styles.tabs}>
                {floors.map((f) => <button key={f} className={`${styles.tab} ${f === activeFloor ? styles.tabActive : ""}`} onClick={() => setActiveFloor(f)}>{f}</button>)}
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.units}>
                  <thead><tr><th>Wohnung</th><th>Geschoss</th><th>Fläche</th><th>Art</th><th>Mietpreis</th><th>Besonderheit</th><th>Status</th></tr></thead>
                  <tbody>
                    {floorRows.map((u) => (
                      <tr key={u.id}>
                        <td><strong>{u.name}</strong></td><td>{u.floor}</td><td>{u.area}</td><td>{u.rooms}</td>
                        <td className={styles.price}>{u.priceLabel || euro(u.price)}</td><td>{u.extra}</td>
                        <td><span className={`${styles.sbadge} ${STATUS_CLASS[u.status]}`}>{STATUS_LABEL[u.status]}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {units.note && <p className={styles.hint}>{units.note}</p>}
          </div>
        </section>
      )}

      <Divider />

      {/* VIRTUELLER RUNDGANG */}
      {(virtualTour.embedUrl || virtualTour.images.length > 0) && (
        <section className={styles.section} id="rundgang">
          <div className={styles.container}>
            <div className={`${styles.head} ${styles.reveal}`}><Badge>{virtualTour.subheading || "Musterwohnung"}</Badge><h2>{virtualTour.heading || "Virtueller Rundgang"}</h2>{virtualTour.description && <p className={styles.lead}>{virtualTour.description}</p>}</div>
            <div className={styles.reveal}>{virtualTour.embedUrl ? <div className={styles.tourEmbed}><iframe src={virtualTour.embedUrl} title="Virtueller Rundgang" allowFullScreen loading="lazy" /></div> : <Slider images={virtualTour.images} />}</div>
          </div>
        </section>
      )}

      {/* INNENRAUM-VISUALISIERUNGEN (blau) */}
      {gallery.length > 0 && (
        <section className={`${styles.section} ${styles.gallerySection} ${styles.leafBg} ${styles.leafBgLight}`} id="galerie">
          <div className={styles.container}>
            <div className={`${styles.head} ${styles.reveal}`}><Badge solid>Einblicke</Badge><h2>Innenraum-Visualisierungen</h2><p className={styles.lead}>Hochwertige Visualisierungen Ihrer zukünftigen Wohnräume.</p></div>
            <div className={styles.reveal}><Slider images={gallery} /></div>
          </div>
        </section>
      )}

      {/* LAGE */}
      <section className={`${styles.section} ${styles.leafBg}`} id="lage">
        <div className={styles.container}>
          <div className={`${styles.head} ${styles.reveal}`}><Badge>Lage</Badge><h2>Standort der Immobilie</h2></div>
          <div className={`${styles.lageGrid} ${styles.reveal}`}>
            <div>
              <h3 style={{ color: branding.primaryColor, marginBottom: ".6rem", fontSize: "1.5rem" }}>{location.address}</h3>
              {location.description && <p className={styles.lead}>{location.description}</p>}
              {location.advantages.length > 0 && (
                <ul className={styles.locList}>
                  {location.advantages.map((a, i) => <li key={i} className={styles.locItem}><span className={styles.locIcon}>{a.iconKey ? <Icon name={a.iconKey} /> : a.icon}</span>{a.text}</li>)}
                </ul>
              )}
            </div>
            {location.mapEmbedUrl && <div className={styles.map}><iframe title="Karte" loading="lazy" src={location.mapEmbedUrl} /></div>}
          </div>
        </div>
      </section>

      <Divider />

      {/* ABLAUF */}
      {process.length > 0 && (
        <section className={`${styles.section} ${styles.leafBg}`} id="ablauf">
          <div className={styles.container}>
            <div className={`${styles.head} ${styles.reveal}`}><Badge>Ablauf</Badge><h2>Ihr Weg ins neue Zuhause</h2></div>
            <div className={`${styles.steps} ${styles.reveal}`}>
              {process.map((p, i) => <div key={i} className={styles.step}><span className={styles.stepNo}>{String(i + 1).padStart(2, "0")}</span><h4>{p.title}</h4><p>{p.description}</p></div>)}
            </div>
            <div className={`${styles.ablaufCta} ${styles.reveal}`}>
              <div className={styles.ablaufCtaIco}><Icon name="calendar" /></div>
              <div>
                <h3>Bereit für Ihr neues Zuhause?</h3>
                <p>Vereinbaren Sie jetzt unverbindlich einen Termin – wir beraten Sie persönlich und provisionsfrei.</p>
                <a className={`${styles.btn}`} href={anfrageHref}><span className={styles.btnArrow}>➜</span> Termin vereinbaren</a>
              </div>
            </div>
          </div>
        </section>
      )}

      <Divider />

      {/* FAQ + KONTAKT */}
      <section className={`${styles.section} ${styles.leafBg}`} id="faq">
        <div className={styles.container}>
          <div className={`${styles.head} ${styles.headLeft} ${styles.reveal}`}><Badge>Kontakt und FAQs</Badge><h2>Häufig gestellte Fragen</h2></div>
          <div className={`${styles.faqContactGrid} ${styles.reveal}`} id="kontakt">
            <div className={styles.contactCard}>
              {branding.logoUrl && <img className={styles.contactLogo} src={branding.logoUrl} alt={intro.projectName} />}
              <ul className={styles.contactList}>
                {legal.companyName && <li><span className={styles.contactIco}><Icon name="building" /></span>{legal.companyName}</li>}
                {contact.persons[0]?.name && <li><span className={styles.contactIco}><Icon name="person" /></span>{contact.persons[0].name}</li>}
                {contact.persons[0]?.phone && <li><span className={styles.contactIco}><Icon name="phone" /></span><a href={`tel:${contact.persons[0].phone.replace(/\s/g, "")}`}>{contact.persons[0].phone}</a></li>}
                {contact.persons[0]?.email && <li><span className={styles.contactIco}><Icon name="mail" /></span><a href={`mailto:${contact.persons[0].email}`}>{contact.persons[0].email}</a></li>}
              </ul>
              <a className={`${styles.btn} ${styles.btnGreen}`} href={anfrageHref}><span className={styles.btnArrow}>➜</span> Jetzt anfragen!</a>
            </div>
            <div className={styles.faqList}>
              {faq.map((f, i) => <details key={i}><summary>{f.question}</summary><p>{f.answer}</p></details>)}
            </div>
          </div>
        </div>
      </section>

      {/* TECHNISCHE UMSETZUNG */}
      <section className={`${styles.section} ${styles.techSection}`} style={{ padding: "80px 0" }}>
        <div className={`${styles.container} ${styles.techInner}`}>
          {branding.agencyLogoUrl && <img className={styles.techStamp} src={branding.agencyLogoUrl} alt="PlanVision3D" />}
          <div className={styles.techText}>
            <div className={styles.techEyebrow}>Support</div>
            <h3>Technische Umsetzung</h3>
            <h4>Geprüft &amp; entwickelt von PlanVision3D</h4>
            <p>Diese Webseite wurde von PlanVision3D entwickelt, geprüft und für funktionsfähig befunden. Wir stehen für durchdachte Weblösungen rund um die digitale Vermarktung von Neubauprojekten.</p>
            <p>Sollten unerwartet technische Probleme auftreten, wenden Sie sich bitte direkt an uns.</p>
            <div className={styles.techLinks}>
              <a href="https://www.planvision3d.de" target="_blank" rel="noreferrer">🌐 www.planvision3d.de</a>
              <a href="mailto:info@planvision3d.de">✉ info@planvision3d.de</a>
              <a href="tel:+491607577845">📞 01607577845</a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer} id="impressum">
        <div className={styles.container}>
          <div className={`${styles.footerHead} ${styles.reveal}`}>
            <span className={styles.footerBadge}>Kontakt &amp; Rechtliches</span>
            <h2>Alle Informationen auf einen Blick</h2>
            <p>Anschrift, Kontaktmöglichkeiten und rechtliche Hinweise kompakt zusammengefasst.</p>
          </div>
          <div className={`${styles.footerCards} ${styles.reveal}`}>
            <div className={styles.fCard}>
              <span className={styles.fCardLabel}>Adresse</span>
              <div className={styles.fRow}><span className={styles.fIco}><Icon name="building" /></span><div className={styles.fRowText}><span>Unternehmen</span><strong>{legal.companyName}</strong></div></div>
              <div className={styles.fRow}><span className={styles.fIco}><Icon name="pin" /></span><div className={styles.fRowText}><span>Straße / Adresse</span><strong>{legal.street}</strong></div></div>
              <div className={styles.fRow}><span className={styles.fIco}><Icon name="globe" /></span><div className={styles.fRowText}><span>PLZ und Ort</span><strong>{legal.cityZip}</strong></div></div>
            </div>
            <div className={styles.fCard}>
              <span className={styles.fCardLabel}>Kontakt</span>
              {legal.representedBy && <div className={styles.fRow}><span className={styles.fIco}><Icon name="person" /></span><div className={styles.fRowText}><span>Vertreten durch</span><strong>{legal.representedBy}</strong></div></div>}
              {legal.phone && <div className={styles.fRow}><span className={styles.fIco}><Icon name="phone" /></span><div className={styles.fRowText}><span>Telefon</span><strong><a href={`tel:${legal.phone.replace(/\s/g, "")}`}>{legal.phone}</a></strong></div></div>}
              {legal.email && <div className={styles.fRow}><span className={styles.fIco}><Icon name="mail" /></span><div className={styles.fRowText}><span>E-Mail</span><strong><a href={`mailto:${legal.email}`}>{legal.email}</a></strong></div></div>}
            </div>
            <div className={styles.fCard}>
              <span className={styles.fCardLabel}>Rechtliches</span>
              <a className={`${styles.fRow} ${styles.fLegalRow}`} href="#impressum"><span className={styles.fIco}><Icon name="document" /></span><div className={styles.fRowText}><strong>Impressum</strong></div></a>
              <a className={`${styles.fRow} ${styles.fLegalRow}`} href="#datenschutz"><span className={styles.fIco}><Icon name="shield" /></span><div className={styles.fRowText}><strong>Datenschutz</strong></div></a>
              <a className={`${styles.fRow} ${styles.fLegalRow}`} href="#haftung"><span className={styles.fIco}><Icon name="shield" /></span><div className={styles.fRowText}><strong>Haftungsausschluss</strong></div></a>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <span>© {new Date().getFullYear()} {legal.companyName}</span>
            <span>Alle Rechte vorbehalten.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
