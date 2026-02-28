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

type IncidentEvent = {
  id: number;
  incident_id: number;
  type: string;
  payload?: any;
  created_at?: string;
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

export default async function IncidentDetailPage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return (
      <main style={{ padding: 24 }}>
        <p>Missing access_token cookie. <a href="/auth/login">Sign in</a>.</p>
      </main>
    );
  }

  const id = params.id;

  const [incidentResp, eventsResp] = await Promise.all([
    fetch(`${apiBase()}/incidents/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
    fetch(`${apiBase()}/incidents/${encodeURIComponent(id)}/events`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
  ]);

  if (!incidentResp.ok) {
    return (
      <main style={{ padding: 24 }}>
        <p>
          Failed to load incident: {incidentResp.status} {await incidentResp.text()}
        </p>
        <p>
          <Link href="/dashboard">Back</Link>
        </p>
      </main>
    );
  }

  const incident: Incident = await incidentResp.json();
  const events: IncidentEvent[] = eventsResp.ok ? await eventsResp.json() : [];

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div>
            <h1 style={{ fontSize: 24, margin: 0 }}>{incident.title}</h1>
            <div style={{ marginTop: 6, opacity: 0.8, fontSize: 13 }}>
              #{incident.id} • {incident.severity} • {incident.status}
              {incident.created_at ? ` • created ${fmtDate(incident.created_at)}` : ""}
            </div>
          </div>
          <Link href="/dashboard" style={{ color: "#fff", textDecoration: "none" }}>
            ← Back
          </Link>
        </div>

        {incident.description ? (
          <p style={{ marginTop: 12, opacity: 0.9, lineHeight: 1.5 }}>{incident.description}</p>
        ) : null}

        <section
          style={{
            marginTop: 18,
            padding: 14,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <h2 style={{ fontSize: 16, margin: 0 }}>Audit trail</h2>
          <p style={{ marginTop: 6, opacity: 0.75, marginBottom: 10 }}>
            These rows come from <code>incident_events</code>.
          </p>

          {events.length === 0 ? (
            <p style={{ opacity: 0.75 }}>No events yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {events.map((e) => (
                <div
                  key={e.id}
                  style={{
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: 12,
                    padding: 12,
                    background: "rgba(0,0,0,0.25)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <strong style={{ fontSize: 13 }}>{e.type}</strong>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>{fmtDate(e.created_at)}</span>
                  </div>
                  {e.payload ? (
                    <pre
                      style={{
                        marginTop: 8,
                        marginBottom: 0,
                        padding: 10,
                        borderRadius: 10,
                        background: "rgba(255,255,255,0.05)",
                        overflowX: "auto",
                        fontSize: 12,
                      }}
                    >
                      {JSON.stringify(e.payload, null, 2)}
                    </pre>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
