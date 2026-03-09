import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

async function getToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("access_token")?.value ?? null;
}

async function getParams(ctx: any): Promise<{ id: string; userId: string } | null> {
  const rawParams = ctx?.params;
  const params = rawParams && typeof rawParams.then === "function" ? await rawParams : rawParams;

  const id = params?.id;
  const userId = params?.userId;

  if (typeof id !== "string" || !id) return null;
  if (typeof userId !== "string" || !userId) return null;

  return { id, userId };
}

export async function DELETE(_req: Request, ctx: any) {
  const p = await getParams(ctx);
  if (!p) return Response.json({ detail: "Missing incident id or user id" }, { status: 400 });

  const token = await getToken();
  if (!token) return Response.json({ detail: "Missing access_token cookie" }, { status: 401 });

  const resp = await fetch(
    `${BACKEND_URL}/incidents/${encodeURIComponent(p.id)}/assign/${encodeURIComponent(p.userId)}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
  );

  const text = await resp.text();
  return new Response(text, {
    status: resp.status,
    headers: { "content-type": resp.headers.get("content-type") ?? "application/json" },
  });
}