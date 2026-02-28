import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function apiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  return raw.replace(/\/$/, "");
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/dashboard?err=Missing%20access_token%20cookie", req.url));
  }

  const form = await req.formData();
  const action = String(form.get("action") || "");

  try {
    if (action === "create") {
      const title = String(form.get("title") || "").trim();
      const severity = String(form.get("severity") || "medium").trim();
      const descriptionRaw = form.get("description");
      const description = descriptionRaw ? String(descriptionRaw).trim() : "";

      const resp = await fetch(`${apiBase()}/incidents/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ title, severity, description: description || null }),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        return NextResponse.redirect(
          new URL(`/dashboard?err=${encodeURIComponent(`Create failed: ${resp.status} ${txt}`)}`, req.url)
        );
      }

      return NextResponse.redirect(new URL("/dashboard?ok=Incident%20created", req.url));
    }

    if (action === "status") {
      const incidentId = String(form.get("incident_id") || "");
      const status = String(form.get("status") || "");

      const resp = await fetch(`${apiBase()}/incidents/${encodeURIComponent(incidentId)}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        return NextResponse.redirect(
          new URL(`/dashboard?err=${encodeURIComponent(`Update failed: ${resp.status} ${txt}`)}`, req.url)
        );
      }
      return NextResponse.redirect(new URL("/dashboard?ok=Incident%20updated", req.url));
    }

    if (action === "delete") {
      const incidentId = String(form.get("incident_id") || "");
      const resp = await fetch(`${apiBase()}/incidents/${encodeURIComponent(incidentId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        const txt = await resp.text();
        return NextResponse.redirect(
          new URL(`/dashboard?err=${encodeURIComponent(`Delete failed: ${resp.status} ${txt}`)}`, req.url)
        );
      }
      return NextResponse.redirect(new URL("/dashboard?ok=Incident%20deleted", req.url));
    }

    return NextResponse.redirect(new URL("/dashboard?err=Unknown%20action", req.url));
  } catch (e: any) {
    return NextResponse.redirect(
      new URL(`/dashboard?err=${encodeURIComponent(e?.message ?? String(e))}`, req.url)
    );
  }
}
