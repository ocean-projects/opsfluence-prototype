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

type UserRow = {
  id: string;
  email: string;
  role: string;
  first_name?: string | null;
  last_name?: string | null;
  is_active: boolean;
};

export default function AdminPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAll() {
    setLoading(true);
    setError("");

    try {
      const [meRes, usersRes] = await Promise.all([
        fetch("/api/me", { cache: "no-store" }),
        fetch("/api/users", { cache: "no-store" }),
      ]);

      if (!meRes.ok) {
        throw new Error(`Me request failed ${meRes.status}`);
      }

      const meData = await meRes.json();
      setMe(meData);

      if (meData.role !== "ADMIN") {
        setError("Admin access required");
        setUsers([]);
        setLoading(false);
        return;
      }

      if (!usersRes.ok) {
        throw new Error(`Users request failed ${usersRes.status}: ${await usersRes.text()}`);
      }

      const usersData = await usersRes.json();
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load admin page");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function saveUser(user: UserRow) {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          first_name: user.first_name ?? null,
          last_name: user.last_name ?? null,
          is_active: user.is_active,
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save user");
    }
  }

  async function disableUser(user: UserRow) {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          is_active: false,
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to disable user");
    }
  }

  function updateLocalUser(id: string, patch: Partial<UserRow>) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }

  if (loading) {
    return <main style={page}>Loading...</main>;
  }

  if (error && me?.role !== "ADMIN") {
    return (
      <main style={page}>
        <div style={topRow}>
          <div>
            <div style={h1}>Admin</div>
            <div style={subtle}>Manage users.</div>
          </div>

          <Link href="/dashboard" style={backLink}>
            Back to dashboard
          </Link>
        </div>

        <div style={errorBox}>{error}</div>
      </main>
    );
  }

  return (
    <main style={page}>
      <div style={topRow}>
        <div>
          <div style={h1}>Admin</div>
          <div style={subtle}>Manage users.</div>
        </div>

        <Link href="/dashboard" style={backLink}>
          Back to dashboard
        </Link>
      </div>

      {error ? <div style={errorBox}>{error}</div> : null}

      <div style={card}>
        <div style={sectionTitle}>Users</div>

        <table style={table}>
          <thead>
            <tr>
              <th style={th}>Email</th>
              <th style={th}>Role</th>
              <th style={th}>First name</th>
              <th style={th}>Last name</th>
              <th style={th}>Status</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={td}>{user.email}</td>
                <td style={td}>{user.role}</td>
                <td style={td}>
                  <input
                    value={user.first_name ?? ""}
                    onChange={(e) => updateLocalUser(user.id, { first_name: e.target.value })}
                    style={input}
                  />
                </td>
                <td style={td}>
                  <input
                    value={user.last_name ?? ""}
                    onChange={(e) => updateLocalUser(user.id, { last_name: e.target.value })}
                    style={input}
                  />
                </td>
                <td style={td}>{user.is_active ? "Active" : "Disabled"}</td>
                <td style={td}>
                  <div style={actions}>
                    <button type="button" style={button} onClick={() => saveUser(user)}>
                      Save
                    </button>

                    {user.is_active ? (
                      <button type="button" style={dangerButton} onClick={() => disableUser(user)}>
                        Disable
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

const page: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
  padding: 24,
  color: "white",
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

const table: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 10px",
  borderBottom: "1px solid rgba(255,255,255,.08)",
  fontSize: 13,
  opacity: 0.8,
};

const td: React.CSSProperties = {
  padding: "12px 10px",
  borderBottom: "1px solid rgba(255,255,255,.06)",
  verticalAlign: "middle",
};

const input: React.CSSProperties = {
  width: "100%",
  minWidth: 120,
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 10,
  background: "transparent",
  color: "inherit",
  padding: "8px 10px",
  fontSize: 13,
  outline: "none",
};

const actions: React.CSSProperties = {
  display: "flex",
  gap: 8,
};

const button: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.06)",
  color: "inherit",
  borderRadius: 10,
  padding: "8px 12px",
  fontSize: 12,
  cursor: "pointer",
};

const dangerButton: React.CSSProperties = {
  border: "1px solid rgba(210,70,70,.8)",
  background: "rgba(140,20,20,.65)",
  color: "white",
  borderRadius: 10,
  padding: "8px 12px",
  fontSize: 12,
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