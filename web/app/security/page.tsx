export default function SecurityPage() {
  return (
    <main style={page}>
      <div style={headerRow}>
        <div>
          <div style={h1}>Security</div>
          <div style={subtle}>
            
          </div>
        </div>

        <a href="/dashboard" style={backLink}>
          Back to dashboard
        </a>
      </div>

      <div style={card}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Password</div>
        <div style={{ ...subtle, marginBottom: 16 }}>
          
        </div>

        <a href="/auth/login" style={button}>
          Change password / sign in again
        </a>

        <div style={{ height: 20 }} />

        <div style={{ fontWeight: 600, marginBottom: 8 }}>Session</div>
        <div style={{ ...subtle, marginBottom: 16 }}>
          End the current session and return to sign in.
        </div>

        <a href="/auth/logout" style={dangerButton}>
          Log out
        </a>
      </div>
    </main>
  );
}

const page: React.CSSProperties = {
  maxWidth: 880,
  margin: "0 auto",
  padding: 24,
  color: "inherit",
};

const headerRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  marginBottom: 18,
};

const h1: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 650,
  marginBottom: 4,
};

const subtle: React.CSSProperties = {
  opacity: 0.75,
  fontSize: 13,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.14)",
  borderRadius: 12,
  padding: 16,
  background: "rgba(255,255,255,.03)",
};

const backLink: React.CSSProperties = {
  color: "inherit",
  textDecoration: "none",
  fontSize: 13,
  opacity: 0.85,
};

const button: React.CSSProperties = {
  display: "inline-block",
  border: "1px solid rgba(255,255,255,.2)",
  borderRadius: 10,
  padding: "10px 14px",
  textDecoration: "none",
  color: "inherit",
  background: "rgba(255,255,255,.05)",
  fontSize: 13,
};

const dangerButton: React.CSSProperties = {
  ...button,
  color: "#f3b3b3",
  border: "1px solid rgba(255,120,120,.25)",
  background: "rgba(255,0,0,.06)",
};