import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_BASE_URL || "http://127.0.0.1:8000";

export async function GET() {
  const store = await cookies();
  const token = store.get("access_token")?.value;

  if (!token) {
    return NextResponse.json({ detail: "Missing access_token cookie" }, { status: 401 });
  }

  try {
    const resp = await fetch(`${API_BASE}/incidents/`, {
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
      { detail: e?.message ?? "Failed to reach backend incidents endpoint" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const store = await cookies();
  const token = store.get("access_token")?.value;

  if (!token) {
    return NextResponse.json({ detail: "Missing access_token cookie" }, { status: 401 });
  }

  try {
    const body = await req.text();

    const resp = await fetch(`${API_BASE}/incidents/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body,
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
      { detail: e?.message ?? "Failed to reach backend create incident endpoint" },
      { status: 500 }
    );
  }
}