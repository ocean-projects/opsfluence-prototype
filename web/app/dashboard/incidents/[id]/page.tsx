"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type IncidentStatus = "OPEN" | "IN_PROGRESS" | "MITIGATED" | "RESOLVED";
type IncidentSeverity = "SEV1" | "SEV2" | "SEV3" | "SEV4";

type UserLite = {
  id: string;
  email?: string;
  first_name?: string | null;
  last_name?: string | null;
};

type Me = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string;
};

type Incident = {
  id: string;
  title: string;
  description?: string | null;
  status: IncidentStatus;
  severity: IncidentSeverity;
  created_by: string;
  assignee_id?: string | null;
  assignee?: UserLite | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type IncidentEvent = {
  id: string;
  incident_id: string;
  actor_id?: string | null;
  actor?: UserLite | null;
  type: string;
  data?: Record<string, unknown> | null;
  created_at?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function formatEnumLabel(value?: string | null) {
  if (!value) return "—";
  return value.replaceAll("_", " ");
}

function displayUser(user?: UserLite | null, fallbackId?: string | null) {
  if (user) {
    const name = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
    return name || user.email || fallbackId || user.id;
  }
  return fallbackId || "—";
}

function displayUserById(users: UserLite[], userId?: string | null) {
  if (!userId) return "—";
  const user = users.find((u) => u.id === userId);
  return displayUser(user, userId);
}

function eventTitle(type: string) {
  switch (type) {
    case "created":
    case "INCIDENT_CREATED":
      return "Created";
    case "title_updated":
    case "TITLE_CHANGED":
      return "Title updated";
    case "description_updated":
    case "DESCRIPTION_UPDATED":
      return "Description updated";
    case "status_updated":
    case "STATUS_CHANGED":
      return "Status updated";
    case "severity_updated":
    case "SEVERITY_CHANGED":
      return "Severity updated";
    case "assignee_updated":
    case "ASSIGNEE_UPDATED":
      return "Assignee updated";
    default:
      return formatEnumLabel(type);
  }
}

function eventDetails(ev: IncidentEvent, users: UserLite[]) {
  const data = ev.data || {};

  const fromValue =
    (data.from as string | null | undefined) ??
    (data.before as string | null | undefined) ??
    null;

  const toValue =
    (data.to as string | null | undefined) ??
    (data.after as string | null | undefined) ??
    null;

  switch (ev.type) {
    case "created":
    case "INCIDENT_CREATED":
      return `Incident created with title "${String(data.title ?? "")}", status ${formatEnumLabel(
        String(data.status ?? "")
      )}, and severity ${String(data.severity ?? "")}.`;

    case "title_updated":
    case "TITLE_CHANGED":
      return `Title updated from "${String(fromValue ?? "")}" to "${String(toValue ?? "")}".`;

    case "description_updated":
    case "DESCRIPTION_UPDATED":
      return `Description updated from "${String(fromValue ?? "")}" to "${String(toValue ?? "")}".`;

    case "status_updated":
    case "STATUS_CHANGED":
      return `Status updated from ${formatEnumLabel(String(fromValue ?? ""))} to ${formatEnumLabel(
        String(toValue ?? "")
      )}.`;

    case "severity_updated":
    case "SEVERITY_CHANGED":
      return `Severity updated from ${String(fromValue ?? "")} to ${String(toValue ?? "")}.`;

    case "assignee_updated":
    case "ASSIGNEE_UPDATED": {
      const fromId = fromValue;
      const toId = toValue;
      return `Assignee changed from ${displayUserById(users, fromId)} to ${displayUserById(users, toId)}.`;
    }

    default:
      return JSON.stringify(data);
  }
}

function sortButton(active: boolean): React.CSSProperties {
  return {
    padding: "4px 8px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,.15)",
    background: active ? "rgba(255,255,255,.15)" : "transparent",
    color: "white",
    cursor: "pointer",
    fontSize: 12,
  };
}

export default function IncidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const incidentId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string | undefined);

  const [me, setMe] = useState<Me | null>(null);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [events, setEvents] = useState<IncidentEvent[]>([]);
  const [users, setUsers] = useState<UserLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [error, setError] = useState("");
  const [eventSort, setEventSort] = useState<"desc" | "asc">("desc");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity>("SEV3");
  const [status, setStatus] = useState<IncidentStatus>("OPEN");
  const [assigneeId, setAssigneeId] = useState("");

  const canLoad = useMemo(() => !!incidentId && incidentId !== "undefined", [incidentId]);
  const isOwner = !!me && !!incident && me.id === incident.created_by;

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const ta = new Date(a.created_at ?? 0).getTime();
      const tb = new Date(b.created_at ?? 0).getTime();
      return eventSort === "desc" ? tb - ta : ta - tb;
    });
  }, [events, eventSort]);

  async function loadAll() {
    if (!canLoad) {
      setError("Incident not found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [meRes, incidentRes, eventsRes, usersRes] = await Promise.all([
        fetch("/api/me", { cache: "no-store" }),
        fetch(`/api/incidents/${incidentId}`, { cache: "no-store" }),
        fetch(`/api/incidents/${incidentId}/events`, { cache: "no-store" }),
        fetch("/api/users", { cache: "no-store" }),
      ]);

      if (meRes.ok) setMe(await meRes.json());

      if (!incidentRes.ok) {
        throw new Error(`Incident API error ${incidentRes.status}: ${await incidentRes.text()}`);
      }

      const incidentData = await incidentRes.json();
      setIncident(incidentData);
      setTitle(incidentData.title ?? "");
      setDescription(incidentData.description ?? "");
      setSeverity(incidentData.severity ?? "SEV3");
      setStatus(incidentData.status ?? "OPEN");
      setAssigneeId(incidentData.assignee_id ?? "");

      if (eventsRes.ok) {
        setEvents(await eventsRes.json());
      } else {
        setEvents([]);
      }

      if (usersRes.ok) {
        setUsers(await usersRes.json());
      } else {
        setUsers([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load incident");
      setIncident(null);
      setEvents([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [incidentId]);

  async function saveIncident(e: React.FormEvent) {
    e.preventDefault();
    if (!incidentId) return;

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/incidents/${incidentId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          severity,
          status,
          assignee_id: assigneeId || null,
        }),
      });

      if (!res.ok) {
        throw new Error(`Save failed ${res.status}: ${await res.text()}`);
      }

      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save incident");
    } finally {
      setSaving(false);
    }
  }

  async function deleteIncident() {
    if (!incidentId) return;

    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/incidents/${incidentId}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirm: deleteConfirm }),
      });

      if (!res.ok) {
        throw new Error(`Delete failed ${res.status}: ${await res.text()}`);
      }

      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete incident");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main style={page}>
      <div style={topRow}>
        <div>
          <div style={titleStyle}>Incident</div>
          <div style={subtle}>{incidentId || "—"}</div>
        </div>

        <Link href="/dashboard" style={backLink}>
          Back to dashboard
        </Link>
      </div>

      {error ? <div style={errorBox}>{error}</div> : null}

      {loading ? (
        <div style={card}>Loading...</div>
      ) : !incident ? (
        <div style={card}>Incident not found.</div>
      ) : (
        <>
          <form onSubmit={saveIncident} style={card}>
            <div style={sectionTitle}>Incident details</div>

            <div style={grid}>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
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
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="MITIGATED">MITIGATED</option>
                <option value="RESOLVED">RESOLVED</option>
              </select>
            </div>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={textarea}
              placeholder="Description"
            />

            <div style={{ marginBottom: 14 }}>
              <div style={label}>Assign to</div>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                style={assignSelect}
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {displayUser(u)}
                  </option>
                ))}
              </select>
            </div>

            <div style={actions}>
              <button type="submit" disabled={saving} style={button}>
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>

          <div style={card}>
            <div style={eventCardHeader}>
              <div style={sectionTitleNoMargin}>Event history</div>

              <div style={sortRow}>
                <span style={sortLabel}>Sort:</span>
                <button type="button" onClick={() => setEventSort("desc")} style={sortButton(eventSort === "desc")}>
                  Newest
                </button>
                <button type="button" onClick={() => setEventSort("asc")} style={sortButton(eventSort === "asc")}>
                  Oldest
                </button>
              </div>
            </div>

            {sortedEvents.length === 0 ? (
              <div style={subtle}>No events yet.</div>
            ) : (
              <div style={list}>
                {sortedEvents.map((ev) => (
                  <div key={ev.id} style={listItem}>
                    <div style={eventHeaderRow}>
                      <div style={eventName}>{eventTitle(ev.type)}</div>
                      <div style={eventTime}>{formatDate(ev.created_at)}</div>
                    </div>

                    <div style={eventMetaRow}>
                      <div>
                        <span style={metaLabel}>Who:</span>{" "}
                        <span style={metaValue}>{displayUser(ev.actor, ev.actor_id)}</span>
                      </div>
                      <div>
                        <span style={metaLabel}>When:</span>{" "}
                        <span style={metaValue}>{formatDate(ev.created_at)}</span>
                      </div>
                    </div>

                    <div style={detailsLabel}>Details</div>
                    <div style={detailsText}>{eventDetails(ev, users)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isOwner ? (
            <div style={dangerCard}>
              <div style={sectionTitle}>Delete incident</div>
              <div style={dangerText}>
                This removes the incident from the live incidents list and archives it in deleted incidents.
              </div>
              <div style={label}>Type DELETE to confirm</div>
              <input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                style={dangerInput}
              />
              <div style={actions}>
                <button
                  type="button"
                  disabled={deleting || deleteConfirm !== "DELETE"}
                  onClick={deleteIncident}
                  style={deleteButton}
                >
                  {deleting ? "Deleting..." : "DELETE"}
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </main>
  );
}

const page: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: 24,
  color: "white",
  fontFamily:
    'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
};

const topRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  marginBottom: 20,
};

const titleStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  marginBottom: 6,
};

const subtle: React.CSSProperties = {
  fontSize: 13,
  opacity: 0.75,
};

const backLink: React.CSSProperties = {
  color: "inherit",
  textDecoration: "none",
  fontSize: 13,
  opacity: 0.9,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 18,
  background: "rgba(255,255,255,.02)",
  padding: 18,
  marginBottom: 18,
};

const dangerCard: React.CSSProperties = {
  border: "1px solid rgba(210,70,70,.7)",
  borderRadius: 18,
  background: "rgba(90,10,10,.25)",
  padding: 18,
  marginBottom: 18,
};

const dangerText: React.CSSProperties = {
  fontSize: 13,
  opacity: 0.85,
  marginBottom: 12,
};

const dangerInput: React.CSSProperties = {
  width: 220,
  maxWidth: "100%",
  border: "1px solid rgba(210,70,70,.7)",
  borderRadius: 12,
  background: "transparent",
  color: "inherit",
  padding: "10px 12px",
  fontSize: 13,
  outline: "none",
  marginBottom: 12,
};

const deleteButton: React.CSSProperties = {
  border: "1px solid rgba(210,70,70,.8)",
  background: "rgba(140,20,20,.65)",
  color: "white",
  borderRadius: 14,
  padding: "10px 16px",
  fontSize: 13,
  cursor: "pointer",
};

const errorBox: React.CSSProperties = {
  marginBottom: 16,
  padding: "14px 16px",
  borderRadius: 14,
  border: "1px solid rgba(210,70,70,.8)",
  background: "rgba(90,10,10,.45)",
  color: "#f2d7d7",
  fontSize: 13,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  marginBottom: 14,
};

const sectionTitleNoMargin: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
};

const grid: React.CSSProperties = {
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
  marginBottom: 14,
};

const label: React.CSSProperties = {
  fontSize: 13,
  opacity: 0.8,
  marginBottom: 6,
};

const assignSelect: React.CSSProperties = {
  width: 280,
  maxWidth: "100%",
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 12,
  background: "transparent",
  color: "inherit",
  padding: "8px 10px",
  fontSize: 12,
  outline: "none",
};

const actions: React.CSSProperties = {
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

const eventCardHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 14,
};

const sortRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12,
};

const sortLabel: React.CSSProperties = {
  opacity: 0.75,
};

const list: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const listItem: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 14,
  padding: 14,
  background: "rgba(255,255,255,.015)",
};

const eventHeaderRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 8,
};

const eventName: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
};

const eventTime: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.7,
};

const eventMetaRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 18,
  marginBottom: 10,
  fontSize: 13,
};

const metaLabel: React.CSSProperties = {
  opacity: 0.7,
};

const metaValue: React.CSSProperties = {};

const detailsLabel: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.7,
  marginBottom: 4,
};

const detailsText: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.5,
};