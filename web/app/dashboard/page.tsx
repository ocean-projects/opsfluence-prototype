import { cookies } from "next/headers";

type Incident = {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  created_at?: string;
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  let incidents: Incident[] = [];
  let error: string | null = null;

  if (!token) {
    error = "No access_token cookie found. Please sign in again.";
  } else {
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/incidents`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!resp.ok) {
        const text = await resp.text();
        error = `API error ${resp.status}: ${text}`;
      } else {
        incidents = await resp.json();
      }
    } catch (e: any) {
      error = `Failed to reach API: ${e?.message ?? String(e)}`;
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Dashboard</h1>
        <a href="/auth/logout" style={{ textDecoration: "none", border: "1px solid #ddd", padding: "10px 14px", borderRadius: 8 }}>
          Sign out
        </a>
      </div>

      {error ? (
        <div style={{ marginTop: 16, padding: 12, border: "1px solid #f99", borderRadius: 8 }}>
          <strong>Auth/API problem:</strong>
          <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{error}</div>
          <div style={{ marginTop: 12 }}>
            <a href="/auth/login" style={{ textDecoration: "none", border: "1px solid #ddd", padding: "10px 14px", borderRadius: 8 }}>
              Sign in again
            </a>
          </div>
        </div>
      ) : (
        <section style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Incidents</h2>

          {incidents.length === 0 ? (
            <p>No incidents yet. Seed data to demo the UI.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 12 }}>
              {incidents.map((i) => (
                <li key={i.id} style={{ border: "1px solid #333", borderRadius: 10, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <strong>{i.title}</strong>
                    <span style={{ opacity: 0.8 }}>{i.status}</span>
                  </div>
                  {i.description ? <p style={{ marginTop: 8, opacity: 0.9 }}>{i.description}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}