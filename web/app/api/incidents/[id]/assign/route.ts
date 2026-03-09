import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

async function getToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("access_token")?.value ?? null;
}

async function getId(ctx: any): Promise<string | null> {
  const rawParams = ctx?.params;
  const params = rawParams && typeof rawParams.then === "function" ? await rawParams : rawParams;
  const id = params?.id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

export async function POST(req: Request, ctx: any) {
  const id = await getId(ctx);
  if (!id) return Response.json({ detail: "Missing incident id" }, { status: 400 });

  const token = await getToken();
  if (!token) return Response.json({ detail: "Missing access_token cookie" }, { status: 401 });

  const body = await req.text();

  const resp = await fetch(`${BACKEND_URL}/incidents/${encodeURIComponent(id)}/assign`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": req.headers.get("content-type") ?? "application/json",
    },
    body,
  });

  const text = await resp.text();
  return new Response(text, {
    status: resp.status,
    headers: { "content-type": resp.headers.get("content-type") ?? "application/json" },
  });
}