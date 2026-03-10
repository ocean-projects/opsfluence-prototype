import { cookies } from "next/headers";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function GET() {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) {
    return new Response(JSON.stringify({ detail: "Missing access_token cookie" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const resp = await fetch(`${API}/deleted-incidents/`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const text = await resp.text();
  return new Response(text, {
    status: resp.status,
    headers: { "content-type": resp.headers.get("content-type") || "application/json" },
  });
}