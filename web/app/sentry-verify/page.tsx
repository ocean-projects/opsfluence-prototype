"use client";

// /sentry-verify — TEMPORARY verify route. Loading this page fires a
// test metric and throws an intentional error so Sentry captures it,
// which in turn triggers the Sentry → Opsfluence webhook. Delete
// this file once you've confirmed the event lands in both dashboards.
//
// Why a client component: Sentry's browser SDK only exists in the
// browser, and we need window.Sentry to be defined by the time the
// effect runs — server-render would skip both branches.

import { useEffect } from "react";

declare global {
  interface Window {
    Sentry?: {
      metrics?: { count: (name: string, value: number) => void };
    };
  }
}

export default function SentryVerify() {
  useEffect(() => {
    if (typeof window !== "undefined" && window.Sentry?.metrics) {
      window.Sentry.metrics.count("test_counter", 1);
    }
    // @ts-expect-error — intentionally undefined to trigger Sentry capture
    myUndefinedFunction();
  }, []);

  return (
    <main style={{ padding: 40, fontFamily: "system-ui" }}>
      <h1>Sentry verify</h1>
      <p>
        Loading this page fires a test metric and throws an
        intentional error. Check Sentry&apos;s dashboard and your
        Opsfluence timeline — the same event should appear in both
        within a few seconds. Delete this route once you&apos;ve
        confirmed.
      </p>
    </main>
  );
}
