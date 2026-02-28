import { cookies } from "next/headers";
import Link from "next/link";

type Incident = {
  id: number;
  title: string;
  description?: string | null;
  severity: string;
  status: string;
  created_at?: string;
  updated_at?: string;
};

function apiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  return raw.replace(/\/$/, "");
}

function fmtDate(s?: string) {
  if (!s) return "";
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s;
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { ok?: string; err?: string };
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  let incidents: Incident[] = [];
  let error: string | null = null;
  const okMsg = searchParams?.ok;
  const errMsg = searchParams?.err;

  if (!token) {
    error = "No access_token cookie found. Please sign in again.";
  } else {
    try {
      const resp = await fetch(`${apiBase()}/incidents/`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!resp.ok) {
        error = `API error ${resp.status}: ${await resp.text()}`;
      } else {
        incidents = await resp.json();
      }
    } catch (e: any) {
      error = `Failed to reach API: ${e?.message ?? String(e)}`;
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        background: "#0b0b0c",
        color: "#f5f5f5",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 28, margin: 0 }}>Dashboard</h1>
            <p style={{ marginTop: 6, opacity: 0.8 }}>
              Create and track incidents (Cognito SSO-ready). Audit events are captured in <code>incident_events</code>.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <a
              href="/auth/logout"
              style={{
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.25)",
                padding: "10px 14px",
                borderRadius: 10,
                color: "#fff",
              }}
            >
              Sign out
            </a>
          </div>
        </header>

        {okMsg ? (
          <div style={{ marginTop: 14, padding: 12, borderRadius: 12, border: "1px solid rgba(0,255,140,0.35)", background: "rgba(0,255,140,0.06)" }}>
            {okMsg}
          </div>
        ) : null}
        {errMsg ? (
          <div style={{ marginTop: 14, padding: 12, borderRadius: 12, border: "1px solid rgba(255,99,132,0.5)", background: "rgba(255,99,132,0.08)" }}>
            {errMsg}
          </div>
        ) : null}

        {error ? (
          <div
            style={{
              marginTop: 16,
              padding: 14,
              border: "1px solid rgba(255,99,132,0.5)",
              borderRadius: 12,
              background: "rgba(255,99,132,0.08)",
            }}
          >
            <strong>Auth/API problem:</strong>
            <div style={{ marginTop: 8, whiteSpace: "pre-wrap", opacity: 0.95 }}>{error}</div>
            <div style={{ marginTop: 12 }}>
              <a
                href="/auth/login"
                style={{
                  textDecoration: "none",
                  border: "1px solid rgba(255,255,255,0.25)",
                  padding: "10px 14px",
                  borderRadius: 10,
                  color: "#fff",
                }}
              >
                Sign in again
              </a>
            </div>
          </div>
        ) : (
          <>
            {/* Create incident */}
            <section
              style={{
                marginTop: 18,
                padding: 14,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <h2 style={{ fontSize: 18, margin: 0 }}>Create incident</h2>
              <p style={{ marginTop: 6, opacity: 0.75, marginBottom: 12 }}>
                This writes to <code>incidents</code> and appends an audit event to <code>incident_events</code>.
              </p>

              <form action="/dashboard/incidents/actions" method="POST" style={{ display: "grid", gap: 10 }}>
                <input type="hidden" name="action" value="create" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 10 }}>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: 13, opacity: 0.8 }}>Title</span>
                    <input
                      name="title"
                      required
                      placeholder="e.g. API 5xx spike"
                      style={{
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.18)",
                        background: "rgba(0,0,0,0.35)",
                        color: "#fff",
                      }}
                    />
                  </label>

                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: 13, opacity: 0.8 }}>Severity</span>
                    <select
                      name="severity"
                      defaultValue="medium"
                      style={{
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.18)",
                        background: "rgba(0,0,0,0.35)",
                        color: "#fff",
                      }}
                    >
                      <option value="low">low</option>
                      <option value="medium">medium</option>
                      <option value="high">high</option>
                      <option value="critical">critical</option>
                    </select>
                  </label>
                </div>

                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 13, opacity: 0.8 }}>Description (optional)</span>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="Add quick context: what changed, impact, suspected root cause"
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.18)",
                      background: "rgba(0,0,0,0.35)",
                      color: "#fff",
                      resize: "vertical",
                    }}
                  />
                </label>

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <button
                    type="submit"
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.22)",
                      background: "rgba(255,255,255,0.06)",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Create
                  </button>
                  <span style={{ fontSize: 13, opacity: 0.65 }}>
                    Tip: keep this minimal for MVP; integrations can emit events into this stream later.
                  </span>
                </div>
              </form>
            </section>

            {/* List incidents */}
            <section style={{ marginTop: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                <h2 style={{ fontSize: 18, margin: 0 }}>Incidents</h2>
                <a
                  href="/dashboard"
                  style={{ fontSize: 13, opacity: 0.85, color: "#fff", textDecoration: "none" }}
                >
                  Refresh
                </a>
              </div>

              {incidents.length === 0 ? (
                <p style={{ marginTop: 10, opacity: 0.75 }}>No incidents yet — create one above.</p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 12, marginTop: 12 }}>
                  {incidents.map((i) => (
                    <li
                      key={i.id}
                      style={{
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 14,
                        padding: 14,
                        background: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                        <div style={{ display: "grid", gap: 6 }}>
                          <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
                            <strong style={{ fontSize: 16 }}>{i.title}</strong>
                            <span style={{ opacity: 0.7, fontSize: 13 }}>
                              #{i.id} • {i.severity}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", opacity: 0.8, fontSize: 13 }}>
                            <span>Status: {i.status}</span>
                            {i.created_at ? <span>Created: {fmtDate(i.created_at)}</span> : null}
                            {i.updated_at ? <span>Updated: {fmtDate(i.updated_at)}</span> : null}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                          <Link
                            href={`/dashboard/incidents/${i.id}`}
                            style={{
                              textDecoration: "none",
                              border: "1px solid rgba(255,255,255,0.18)",
                              padding: "8px 10px",
                              borderRadius: 10,
                              color: "#fff",
                              fontSize: 13,
                            }}
                          >
                            View
                          </Link>

                          {/* Status transitions */}
                          <form action="/dashboard/incidents/actions" method="POST">
                            <input type="hidden" name="action" value="status" />
                            <input type="hidden" name="incident_id" value={String(i.id)} />
                            <input type="hidden" name="status" value={i.status === "OPEN" ? "IN_PROGRESS" : "OPEN"} />
                            <button
                              type="submit"
                              style={{
                                border: "1px solid rgba(255,255,255,0.18)",
                                padding: "8px 10px",
                                borderRadius: 10,
                                background: "transparent",
                                color: "#fff",
                                fontSize: 13,
                                cursor: "pointer",
                              }}
                              title={i.status === "OPEN" ? "Mark in progress" : "Reopen"}
                            >
                              {i.status === "OPEN" ? "Start" : "Reopen"}
                            </button>
                          </form>

                          <form action="/dashboard/incidents/actions" method="POST">
                            <input type="hidden" name="action" value="status" />
                            <input type="hidden" name="incident_id" value={String(i.id)} />
                            <input type="hidden" name="status" value="RESOLVED" />
                            <button
                              type="submit"
                              style={{
                                border: "1px solid rgba(255,255,255,0.18)",
                                padding: "8px 10px",
                                borderRadius: 10,
                                background: "transparent",
                                color: "#fff",
                                fontSize: 13,
                                cursor: "pointer",
                              }}
                              title="Mark resolved"
                            >
                              Resolve
                            </button>
                          </form>

                          <form action="/dashboard/incidents/actions" method="POST">
                            <input type="hidden" name="action" value="status" />
                            <input type="hidden" name="incident_id" value={String(i.id)} />
                            <input type="hidden" name="status" value="CLOSED" />
                            <button
                              type="submit"
                              style={{
                                border: "1px solid rgba(255,255,255,0.18)",
                                padding: "8px 10px",
                                borderRadius: 10,
                                background: "transparent",
                                color: "#fff",
                                fontSize: 13,
                                cursor: "pointer",
                              }}
                              title="Close"
                            >
                              Close
                            </button>
                          </form>

                          <form action="/dashboard/incidents/actions" method="POST">
                            <input type="hidden" name="action" value="delete" />
                            <input type="hidden" name="incident_id" value={String(i.id)} />
                            <button
                              type="submit"
                              style={{
                                border: "1px solid rgba(255,99,132,0.55)",
                                padding: "8px 10px",
                                borderRadius: 10,
                                background: "rgba(255,99,132,0.10)",
                                color: "#fff",
                                fontSize: 13,
                                cursor: "pointer",
                              }}
                              title="Delete"
                            >
                              Delete
                            </button>
                          </form>
                        </div>
                      </div>

                      {i.description ? <p style={{ marginTop: 10, opacity: 0.9 }}>{i.description}</p> : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section style={{ marginTop: 18, opacity: 0.75, fontSize: 13 }}>
              <div>Backend docs: <a style={{ color: "#fff" }} href={`${apiBase()}/docs`}>{`${apiBase()}/docs`}</a></div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
