"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type IncidentStatus = "OPEN" | "IN_PROGRESS" | "MITIGATED" | "RESOLVED";
type IncidentSeverity = "SEV1" | "SEV2" | "SEV3" | "SEV4";

type UserLite = {
  id: string;
  email?: string;
  first_name?: string | null;
  last_name?: string | null;
};

type Incident = {
  id: string;
  title: string;
  description?: string | null;
  status: IncidentStatus;
  severity: IncidentSeverity;
  created_at?: string | null;
  updated_at?: string | null;
  assignee_id?: string | null;
  assignee?: UserLite | null;
};

type Me = {
  id: string;
  email?: string;
  role?: string;
  first_name?: string | null;
  last_name?: string | null;
};

type SortKey = "created_desc" | "status" | "title";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function shortId(id: string) {
  return id.slice(0, 8) + "…";
}

function fullName(user?: UserLite | null) {
  if (!user) return "—";
  const name = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
  return name || user.email || "—";
}

export default function DashboardClient() {
  const [me, setMe] = useState<Me | null>(null);
  const [users, setUsers] = useState<UserLite[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity>("SEV3");
  const [status, setStatus] = useState<IncidentStatus>("OPEN");
  const [sortKey, setSortKey] = useState<SortKey>("created_desc");

  async function loadAll() {
    setLoading(true);
    setError("");

    try {
      const [meRes, incidentsRes, usersRes] = await Promise.all([
        fetch("/api/me", { cache: "no-store" }),
        fetch("/api/incidents", { cache: "no-store" }),
        fetch("/api/users", { cache: "no-store" }),
      ]);

      let nextError = "";

      if (meRes.ok) {
        setMe(await meRes.json());
      } else {
        setMe(null);
        nextError = `API error ${meRes.status}: ${await meRes.text()}`;
      }

      if (incidentsRes.ok) {
        setIncidents(await incidentsRes.json());
      } else {
        setIncidents([]);
        if (!nextError) {
          nextError = `API error ${incidentsRes.status}: ${await incidentsRes.text()}`;
        }
      }

      if (usersRes.ok) {
        setUsers(await usersRes.json());
      } else {
        setUsers([]);
      }

      setError(nextError);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      setIncidents([]);
      setUsers([]);
      setMe(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function createIncident(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          severity,
          status,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API error ${res.status}: ${text}`);
      }

      setTitle("");
      setDescription("");
      setSeverity("SEV3");
      setStatus("OPEN");
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create incident");
    } finally {
      setSubmitting(false);
    }
  }

  async function assignIncident(incidentId: string, userId: string) {
    try {
      const res = await fetch(`/api/incidents/${incidentId}/assign/${userId}`, {
        method: "POST",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API error ${res.status}: ${text}`);
      }

      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to assign incident");
    }
  }

  const sortedIncidents = useMemo(() => {
    const arr = [...incidents];

    if (sortKey === "created_desc") {
      arr.sort((a, b) => {
        const av = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bv = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bv - av;
      });
    } else if (sortKey === "status") {
      arr.sort((a, b) => a.status.localeCompare(b.status));
    } else if (sortKey === "title") {
      arr.sort((a, b) => a.title.localeCompare(b.title));
    }

    return arr;
  }, [incidents, sortKey]);

  return (
    <div>
      {error ? (
        <div style={errorBox}>
          <strong>Auth/API problem:</strong>
          <div style={{ marginTop: 8 }}>{error}</div>
        </div>
      ) : null}

      <form onSubmit={createIncident} style={card}>
        <div style={sectionTitle}>Create incident</div>

        <div style={formGrid}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (required)"
            style={input}
          />

          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
            style={input}
          >
            <option value="SEV1">SEV1</option>
            <option value="SEV2">SEV2</option>
            <option value="SEV3">SEV3</option>
            <option value="SEV4">SEV4</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as IncidentStatus)}
            style={input}
          >
            <option value="OPEN">OPEN</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="MITIGATED">MITIGATED</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </div>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (required)"
          style={textarea}
        />

        <div style={actionsRow}>
          <button type="submit" disabled={submitting} style={button}>
            {submitting ? "Creating..." : "Create"}
          </button>

          <button type="button" onClick={loadAll} style={buttonSecondary}>
            Refresh
          </button>
        </div>
      </form>

      <div style={tableHeaderRow}>
        <div style={sectionTitle}>Incidents</div>

        <div style={sortWrap}>
          <span style={{ opacity: 0.8 }}>Sort:</span>
          <button type="button" onClick={() => setSortKey("created_desc")} style={sortButton(sortKey === "created_desc")}>
            Created (desc)
          </button>
          <button type="button" onClick={() => setSortKey("status")} style={sortButton(sortKey === "status")}>
            Status
          </button>
          <button type="button" onClick={() => setSortKey("title")} style={sortButton(sortKey === "title")}>
            Title
          </button>
        </div>
      </div>

      <div style={tableWrap}>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>ID</th>
              <th style={th}>Title</th>
              <th style={th}>Status</th>
              <th style={th}>Severity</th>
              <th style={th}>Created</th>
              <th style={th}>Updated</th>
              <th style={th}>Assigned</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td style={td} colSpan={7}>
                  Loading...
                </td>
              </tr>
            ) : sortedIncidents.length === 0 ? (
              <tr>
                <td style={td} colSpan={7}>
                  No incidents yet.
                </td>
              </tr>
            ) : (
              sortedIncidents.map((incident) => (
                <tr key={incident.id} style={tr}>
                  <td style={td}>
                    <Link
                      href={`/dashboard/incidents/${incident.id}`}
                      style={linkCell}
                      title={incident.id}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {shortId(incident.id)}
                    </Link>
                  </td>

                  <td style={td}>
                    <Link
                      href={`/dashboard/incidents/${incident.id}`}
                      style={titleLink}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {incident.title}
                    </Link>
                    {incident.description ? (
                      <div style={subRow}>{incident.description}</div>
                    ) : null}
                  </td>

                  <td style={td}>{incident.status}</td>
                  <td style={td}>{incident.severity}</td>
                  <td style={td}>{formatDate(incident.created_at)}</td>
                  <td style={td}>{formatDate(incident.updated_at)}</td>

                  <td style={td}>
                    <select
                      value={incident.assignee_id || ""}
                      onChange={(e) => {
                        const next = e.target.value;
                        if (next) assignIncident(incident.id, next);
                      }}
                      style={assignSelect}
                    >
                      <option value="">{incident.assignee ? fullName(incident.assignee) : "—"}</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {fullName(u)}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const errorBox: React.CSSProperties = {
  marginBottom: 18,
  padding: "16px 18px",
  borderRadius: 16,
  border: "1px solid rgba(210,70,70,.8)",
  background: "rgba(90,10,10,.45)",
  color: "#f2d7d7",
  fontSize: 13,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.1)",
  borderRadius: 18,
  padding: 18,
  background: "rgba(255,255,255,.02)",
  marginBottom: 26,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  marginBottom: 14,
};

const formGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 140px 140px",
  gap: 8,
  marginBottom: 10,
};

const input: React.CSSProperties = {
  width: "100%",
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 14,
  background: "transparent",
  color: "inherit",
  padding: "10px 12px",
  fontSize: 13,
  outline: "none",
};

const textarea: React.CSSProperties = {
  width: "100%",
  minHeight: 110,
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 14,
  background: "transparent",
  color: "inherit",
  padding: "12px",
  fontSize: 13,
  resize: "vertical",
  outline: "none",
  marginBottom: 12,
};

const actionsRow: React.CSSProperties = {
  display: "flex",
  gap: 10,
};

const button: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.06)",
  color: "inherit",
  borderRadius: 14,
  padding: "10px 16px",
  fontSize: 13,
  cursor: "pointer",
};

const buttonSecondary: React.CSSProperties = {
  ...button,
  background: "transparent",
};

const tableHeaderRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 10,
};

const sortWrap: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
};

const sortButton = (active: boolean): React.CSSProperties => ({
  border: "none",
  background: "transparent",
  color: "inherit",
  textDecoration: "underline",
  opacity: active ? 1 : 0.8,
  cursor: "pointer",
  padding: 0,
  fontSize: 13,
});

const tableWrap: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.1)",
  borderRadius: 18,
  overflow: "hidden",
  background: "rgba(255,255,255,.02)",
};

const table: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
};

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "14px 18px",
  borderBottom: "1px solid rgba(255,255,255,.08)",
  background: "rgba(255,255,255,.03)",
  fontWeight: 650,
};

const tr: React.CSSProperties = {
  borderBottom: "1px solid rgba(255,255,255,.06)",
};

const td: React.CSSProperties = {
  padding: "14px 18px",
  verticalAlign: "top",
};

const titleLink: React.CSSProperties = {
  color: "inherit",
  textDecoration: "none",
  fontWeight: 600,
};

const linkCell: React.CSSProperties = {
  color: "inherit",
  textDecoration: "none",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: 12,
};

const subRow: React.CSSProperties = {
  marginTop: 4,
  opacity: 0.75,
  fontSize: 12,
};

const assignSelect: React.CSSProperties = {
  width: "100%",
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 12,
  background: "transparent",
  color: "inherit",
  padding: "8px 10px",
  fontSize: 12,
  outline: "none",
};