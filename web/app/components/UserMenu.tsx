"use client";

import { useEffect, useRef, useState } from "react";

type Me = {
  id?: string;
  email?: string;
  role?: string;
  first_name?: string | null;
  last_name?: string | null;
  is_active?: boolean;
};

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => setMe(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);

    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const displayName = me?.first_name || "User";
  const isAdmin = me?.role === "ADMIN";

  return (
    <div ref={wrapRef} style={wrap}>
      <button type="button" onClick={() => setOpen((v) => !v)} style={trigger} aria-label="Open account menu">
        <span style={triggerLines}>☰</span>
      </button>

      {open ? (
        <div style={menu}>
          <div style={menuHeader}>
            <div style={menuName}>{displayName}</div>
          </div>

          <a href="/account" style={menuItem}>
            Account
          </a>

          <a href="/security" style={menuItem}>
            Security
          </a>

          {isAdmin ? (
            <a href="/admin" style={menuItem}>
              Admin
            </a>
          ) : null}

          <a href="/auth/logout" style={{ ...menuItem, color: "#f3b3b3" }}>
            Log out
          </a>
        </div>
      ) : null}
    </div>
  );
}

const wrap: React.CSSProperties = {
  position: "relative",
};

const trigger: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,.16)",
  background: "rgba(255,255,255,.03)",
  color: "inherit",
  cursor: "pointer",
  fontSize: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const triggerLines: React.CSSProperties = {
  lineHeight: 1,
  opacity: 0.9,
};

const menu: React.CSSProperties = {
  position: "absolute",
  top: 46,
  right: 0,
  minWidth: 240,
  border: "1px solid rgba(255,255,255,.14)",
  borderRadius: 12,
  background: "#111214",
  boxShadow: "0 12px 32px rgba(0,0,0,.35)",
  overflow: "hidden",
  zIndex: 50,
};

const menuHeader: React.CSSProperties = {
  padding: "12px 14px",
  borderBottom: "1px solid rgba(255,255,255,.08)",
  background: "rgba(255,255,255,.02)",
};

const menuName: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
};

const menuItem: React.CSSProperties = {
  display: "block",
  padding: "11px 14px",
  color: "inherit",
  textDecoration: "none",
  fontSize: 13,
  borderTop: "1px solid rgba(255,255,255,.05)",
};