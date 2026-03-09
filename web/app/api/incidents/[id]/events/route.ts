import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE = process.env.API_BASE_URL || "http://127.0.0.1:8000";

type ParamsInput = { params: Promise<{ id: string }> | { id: string } };

async function getId(paramsInput: ParamsInput["params"]) {
  const resolved = await paramsInput;
  return resolved?.id;
}

export async function GET(_req: Request, { params }: ParamsInput) {
  const id = await getId(params);

  if (!id) {
    return NextResponse.json({ detail: "Missing incident id" }, { status: 400 });
  }

  const store = await cookies();
  const token = store.get("access_token")?.value;

  if (!token) {
    return NextResponse.json({ detail: "Missing access_token cookie" }, { status: 401 });
  }

  try {
    const resp = await fetch(`${API_BASE}/incidents/${id}/events`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const text = await resp.text();

    return new NextResponse(text, {
      status: resp.status,
      headers: {
        "content-type": resp.headers.get("content-type") || "application/json",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { detail: e?.message ?? "Failed to reach backend incident events endpoint" },
      { status: 500 }
    );
  }
}