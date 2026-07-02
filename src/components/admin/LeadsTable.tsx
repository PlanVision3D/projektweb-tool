"use client";
import { useState } from "react";
import type { Lead, LeadStatus } from "@/types/content";

const STATUSES: LeadStatus[] = ["neu", "kontaktiert", "abgeschlossen"];

/**
 * Formulare verschiedener Projekt-Versionen liefern unterschiedliche Feld-
 * Bezeichnungen (z.B. "Wie lautet ihr vollständiger Name?" vs. "Ihr Name").
 * Damit die Tabelle nicht in dutzende Spalten zerfällt, werden gleichbedeutende
 * Felder über Schlüsselwörter zu EINER Spalte zusammengeführt.
 */
const CANON: { label: string; match: RegExp }[] = [
  { label: "Name", match: /name/i },
  { label: "Telefon", match: /telefon|phone|nummer|handy|mobil/i },
  { label: "E-Mail", match: /mail/i },
  { label: "Erreichbarkeit", match: /erreichbar|uhrzeit|zeit/i },
  { label: "Nachricht", match: /nachricht|message|anliegen|kommentar/i },
  { label: "Datenschutz", match: /datenschutz|einwillig|zustimm/i },
];

function valueFor(lead: Lead, regex: RegExp): string {
  const hit = Object.entries(lead.data).find(([k, v]) => regex.test(k) && v && String(v).trim() && v !== "–");
  return hit ? String(hit[1]) : "";
}

export default function LeadsTable({ leads: initial }: { leads: Lead[] }) {
  const [leads, setLeads] = useState(initial);

  async function setStatus(id: string, status: LeadStatus) {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)));
    await fetch(`/api/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
  }

  if (leads.length === 0) {
    return <div className="card empty"><h2>Noch keine Leads</h2><p className="muted">Sobald jemand das Kontaktformular der Live-Seite ausfüllt, erscheinen die Anfragen hier.</p></div>;
  }

  // Nur kanonische Spalten zeigen, für die es überhaupt Werte gibt
  const cols = CANON.filter((c) => leads.some((l) => valueFor(l, c.match)));
  // Felder, die zu keiner kanonischen Spalte passen, als Zusatzspalten anhängen
  const usedRegexes = cols.map((c) => c.match);
  const extraCols = Array.from(new Set(leads.flatMap((l) => Object.keys(l.data))))
    .filter((k) => !CANON.some((c) => c.match.test(k)))
    .filter((k) => leads.some((l) => l.data[k] && String(l.data[k]).trim() && l.data[k] !== "–"));

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="lead-table">
        <thead>
          <tr>
            <th>Eingegangen</th>
            {cols.map((c) => <th key={c.label}>{c.label}</th>)}
            {extraCols.map((k) => <th key={k}>{k}</th>)}
            <th style={{ textAlign: "right" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id}>
              <td style={{ whiteSpace: "nowrap", color: "var(--muted-foreground)" }}>
                {new Date(l.createdAt).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })}
              </td>
              {cols.map((c) => {
                const v = valueFor(l, c.match);
                return <td key={c.label}>{v || <span style={{ color: "var(--muted-foreground)" }}>–</span>}</td>;
              })}
              {extraCols.map((k) => (
                <td key={k}>{l.data[k] || <span style={{ color: "var(--muted-foreground)" }}>–</span>}</td>
              ))}
              <td style={{ textAlign: "right" }}>
                <select className="lead-status" value={l.status} onChange={(e) => setStatus(l.id, e.target.value as LeadStatus)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
