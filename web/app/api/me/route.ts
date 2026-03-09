import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = (await cookies()).get("access_token")?.value;

  if (!token) {
    return new Response(JSON.stringify({ detail: "Missing access_token cookie" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const resp = await fetch(`${API_BASE}/users/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const text = await resp.text();

  return new Response(text, {
    status: resp.status,
    headers: {
      "content-type": resp.headers.get("content-type") || "application/json",
    },
  });
}

export async function PATCH(req: Request) {
  const token = (await cookies()).get("access_token")?.value;

  if (!token) {
    return new Response(JSON.stringify({ detail: "Missing access_token cookie" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const body = await req.text();

  const resp = await fetch(`${API_BASE}/users/me`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body,
    cache: "no-store",
  });

  const text = await resp.text();

  return new Response(text, {
    status: resp.status,
    headers: {
      "content-type": resp.headers.get("content-type") || "application/json",
    },
  });
}