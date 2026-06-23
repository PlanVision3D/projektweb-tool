"use client";
import { useState } from "react";
import type { Lead, LeadStatus } from "@/types/content";

const STATUSES: LeadStatus[] = ["neu", "kontaktiert", "abgeschlossen"];

export default function LeadsTable({ leads: initial }: { leads: Lead[] }) {
  const [leads, setLeads] = useState(initial);

  async function setStatus(id: string, status: LeadStatus) {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)));
    await fetch(`/api/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
  }

  if (leads.length === 0) {
    return <div className="card empty"><h2>Noch keine Leads</h2><p className="muted">Sobald jemand das Kontaktformular der Live-Seite ausfüllt, erscheinen die Anfragen hier.</p></div>;
  }

  // Alle vorkommenden Feld-Labels als Spalten
  const fields = Array.from(new Set(leads.flatMap((l) => Object.keys(l.data))));

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="lead-table">
        <thead>
          <tr>
            <th>Eingegangen</th>
            {fields.map((f) => <th key={f}>{f}</th>)}
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id}>
              <td>{new Date(l.createdAt).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })}</td>
              {fields.map((f) => <td key={f}>{l.data[f] || "–"}</td>)}
              <td>
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
