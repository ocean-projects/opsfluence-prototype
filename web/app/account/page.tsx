"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Me = {
  id: string;
  email?: string;
  role?: string;
  first_name?: string | null;
  last_name?: string | null;
};

export default function AccountPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadMe() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`API error ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      setMe(data);
      setFirstName(data.first_name ?? "");
      setLastName(data.last_name ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load account");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
        }),
      });

      if (!res.ok) {
        throw new Error(`API error ${res.status}: ${await res.text()}`);
      }

      const updated = await res.json();
      setMe(updated);
      setFirstName(updated.first_name ?? "");
      setLastName(updated.last_name ?? "");
      setMessage("Account details updated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save account");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={page}>
      <div style={topRow}>
        <div>
          <div style={title}>Account</div>
          <div style={subtle}>Update your account details.</div>
        </div>

        <Link href="/dashboard" style={backLink}>
          Back to dashboard
        </Link>
      </div>

      {error ? <div style={errorBox}>{error}</div> : null}
      {message ? <div style={successBox}>{message}</div> : null}

      <form onSubmit={saveProfile} style={card}>
        <div style={sectionTitle}>Profile</div>

        {loading ? (
          <div style={subtle}>Loading...</div>
        ) : (
          <>
            <div style={fieldGrid}>
              <div>
                <label style={label}>First name</label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={input}
                  placeholder="First name"
                />
              </div>

              <div>
                <label style={label}>Last name</label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  style={input}
                  placeholder="Last name"
                />
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <label style={label}>Email</label>
              <div style={managedBox}>
                <div style={managedText}>Email is managed by Cognito.</div>
                <a href="/security" style={managedLink}>
                  Change email
                </a>
              </div>
            </div>

            <div style={actions}>
              <button type="submit" disabled={saving} style={button}>
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </>
        )}
      </form>
    </main>
  );
}

const page: React.CSSProperties = {
  maxWidth: 920,
  margin: "0 auto",
  padding: 24,
  fontFamily:
    'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
  color: "white",
};

const topRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  marginBottom: 24,
};

const title: React.CSSProperties = {
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
};

const sectionTitle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  marginBottom: 14,
};

const fieldGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 14,
};

const label: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  opacity: 0.8,
  marginBottom: 6,
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

const managedBox: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.1)",
  borderRadius: 14,
  padding: "12px 14px",
  background: "rgba(255,255,255,.02)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
};

const managedText: React.CSSProperties = {
  fontSize: 13,
  opacity: 0.9,
};

const managedLink: React.CSSProperties = {
  color: "inherit",
  fontSize: 13,
  textDecoration: "underline",
  whiteSpace: "nowrap",
};

const actions: React.CSSProperties = {
  marginTop: 18,
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

const errorBox: React.CSSProperties = {
  marginBottom: 16,
  padding: "14px 16px",
  borderRadius: 14,
  border: "1px solid rgba(210,70,70,.8)",
  background: "rgba(90,10,10,.45)",
  color: "#f2d7d7",
  fontSize: 13,
};

const successBox: React.CSSProperties = {
  marginBottom: 16,
  padding: "14px 16px",
  borderRadius: 14,
  border: "1px solid rgba(70,160,90,.7)",
  background: "rgba(15,70,25,.35)",
  color: "#d8f0dc",
  fontSize: 13,
};