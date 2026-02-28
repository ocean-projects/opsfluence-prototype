export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Opsfluence</h1>
      <p style={{ marginBottom: 16 }}>
        Incident tracking + audit-friendly workflows (Cognito SSO-ready).
      </p>

      <a
        href="/auth/login"
        style={{
          display: "inline-block",
          padding: "10px 14px",
          borderRadius: 8,
          border: "1px solid #ddd",
          textDecoration: "none",
        }}
      >
        Sign in
      </a>
    </main>
  );
}