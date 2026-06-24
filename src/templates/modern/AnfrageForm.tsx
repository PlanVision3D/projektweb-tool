"use client";
import { useState } from "react";
import type { ProjectContent } from "@/types/content";
import styles from "./anfrage.module.css";

export default function AnfrageForm({ content, projectId, slug, basePath }: { content: ProjectContent; projectId: string; slug: string; basePath?: string }) {
  const { branding, intro, hero, contact } = content;
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  // Zurück-Link: Custom Domain -> "/", Vorschau -> "/site/<slug>"
  const backHref = basePath !== undefined ? (basePath || "/") : `/site/${slug}`;

  const themeVars = {
    ["--primary" as any]: branding.primaryColor,
    ["--secondary" as any]: branding.secondaryColor,
    ["--cta" as any]: branding.ctaColor || "#6f9a3c",
    ["--badge" as any]: branding.badgeColor || "#b56a43",
    ["--font-head" as any]: `"${branding.font && branding.font !== "Poppins" ? branding.font : "Cormorant Garamond"}", Georgia, serif`,
  } as React.CSSProperties;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data: Record<string, string> = {};
    contact.formFields.forEach((f) => {
      const el = form.elements.namedItem(f.key) as HTMLInputElement | HTMLSelectElement | null;
      if (el) data[f.label] = f.type === "checkbox" ? ((el as HTMLInputElement).checked ? "Ja" : "Nein") : el.value;
    });
    setBusy(true);
    try { await fetch(`/api/projects/${projectId}/leads`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); } catch {}
    setBusy(false); setSent(true);
  }

  return (
    <div className={styles.page} style={themeVars}>
      {hero.image && <div className={styles.bg} style={{ backgroundImage: `url(${hero.image.url})` }} />}
      <div className={styles.overlay} />
      <div className={styles.inner}>
        <a className={styles.back} href={backHref}>← Zurück zur Webseite</a>
        <div className={styles.card}>
          <div className={styles.side}>
            {branding.logoUrl && <img className={styles.logo} src={branding.logoUrl} alt={intro.projectName} />}
            <h1>Termin vereinbaren</h1>
            <p>{intro.projectName} – {hero.subheadline || "Jetzt unverbindlich anfragen"}.</p>
            <ul>
              <li>✓ Unverbindlich & provisionsfrei</li>
              <li>✓ Persönliche Beratung</li>
              <li>✓ Schnelle Rückmeldung</li>
            </ul>
            {contact.persons[0] && (
              <div className={styles.person}>
                <span>Ihr Ansprechpartner</span>
                <strong>{contact.persons[0].name}</strong>
                {contact.persons[0].phone && <a href={`tel:${contact.persons[0].phone.replace(/\s/g, "")}`}>📞 {contact.persons[0].phone}</a>}
              </div>
            )}
          </div>
          <div className={styles.formWrap}>
            {sent ? (
              <div className={styles.success}>
                <div className={styles.check}>✓</div>
                <h2>Vielen Dank für Ihre Anfrage!</h2>
                <p>Wir prüfen Ihre Angaben und melden uns persönlich bei Ihnen.</p>
                <a className={styles.submit} href={backHref}>Zurück zur Webseite</a>
              </div>
            ) : (
              <form onSubmit={submit}>
                {contact.formFields.map((field) => {
                  if (field.type === "checkbox") return <label key={field.key} className={styles.check2}><input type="checkbox" name={field.key} required={field.required} /> <span>{field.label}</span></label>;
                  if (field.type === "select") return (
                    <label key={field.key} className={styles.field}>{field.label}
                      <select name={field.key} required={field.required} defaultValue=""><option value="" disabled>Bitte wählen…</option>{(field.options ?? []).map((o) => <option key={o}>{o}</option>)}</select>
                    </label>
                  );
                  return <label key={field.key} className={styles.field}>{field.label}<input type={field.type} name={field.key} required={field.required} /></label>;
                })}
                <button type="submit" className={styles.submit} disabled={busy}>{busy ? "Wird gesendet…" : "Anfrage absenden ➜"}</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
