import Link from "next/link";
import DashboardClientWrapper from "./DashboardClientWrapper";
import UserMenu from "../components/UserMenu";

export default function DashboardPage() {
  return (
    <main style={page}>
      <div style={topRow}>
        <div>
          <div style={h1}>Dashboard</div>
          <div style={subtle}>Create, track and audit incidents.</div>
        </div>

        <UserMenu />
      </div>

      <DashboardClientWrapper />

      <div style={bottomLinkRow}>
        <Link href="/deleted-incidents" className="deleted-incidents-link" style={deletedIncidentsLink}>
          Deleted incidents
        </Link>
      </div>
    </main>
  );
}

const page: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
  padding: 24,
  fontFamily:
    'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
  fontSize: 14,
  lineHeight: 1.35,
};

const topRow: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 18,
};

const h1: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 650,
  letterSpacing: "-0.01em",
  marginBottom: 4,
};

const subtle: React.CSSProperties = {
  opacity: 0.75,
  fontSize: 13,
};

const bottomLinkRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  marginTop: 10,
};

const deletedIncidentsLink: React.CSSProperties = {
  fontSize: 12,
  color: "#9a9a9a",
  textDecoration: "none",
  padding: "4px 10px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,.08)",
  background: "rgba(255,255,255,.03)",
  opacity: 0.85,
};