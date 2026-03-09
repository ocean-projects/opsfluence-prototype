export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
        textAlign: "center",
        padding: 24,
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Opsfluence</h1>

      <p style={{ opacity: 0.75, marginBottom: 20, maxWidth: 480 }}>
        Incident tracking and audit-grade operational visibility.
      </p>

      <a
        href="/auth/login"
        style={{
          display: "inline-block",
          padding: "8px 14px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,.2)",
          textDecoration: "none",
        }}
      >
        Sign in
      </a>
    </main>
  );
}