"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type DeletedIncident = {
  id: string;
  original_incident_id: string;
  title: string;
  description?: string | null;
  status: string;
  severity: string;
  deleted_at: string;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default function DeletedIncidentsPage() {
  const [rows, setRows] = useState<DeletedIncident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/deleted-incidents", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24, color: "white" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Deleted incidents</div>
          <div style={{ fontSize: 13, opacity: 0.75 }}>Archived incidents removed from the live list.</div>
        </div>
        <Link href="/dashboard" style={{ color: "inherit", textDecoration: "none", fontSize: 13 }}>
          Back to dashboard
        </Link>
      </div>

      <div style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 18, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={th}>Title</th>
              <th style={th}>Status</th>
              <th style={th}>Severity</th>
              <th style={th}>Deleted at</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td style={td} colSpan={4}>Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td style={td} colSpan={4}>No deleted incidents.</td></tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td style={td}>
                    <div style={{ fontWeight: 600 }}>{row.title}</div>
                    {row.description ? <div style={{ opacity: 0.75, marginTop: 4 }}>{row.description}</div> : null}
                  </td>
                  <td style={td}>{row.status}</td>
                  <td style={td}>{row.severity}</td>
                  <td style={td}>{formatDate(row.deleted_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "14px 18px",
  borderBottom: "1px solid rgba(255,255,255,.08)",
  background: "rgba(255,255,255,.03)",
};

const td: React.CSSProperties = {
  padding: "14px 18px",
  borderBottom: "1px solid rgba(255,255,255,.06)",
};