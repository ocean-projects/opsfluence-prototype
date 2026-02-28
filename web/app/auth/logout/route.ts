import { NextResponse } from "next/server";

export async function GET() {
  const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const logoutUri = process.env.NEXT_PUBLIC_COGNITO_LOGOUT_URI;

  if (!domain || !clientId || !logoutUri) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  const url = new URL(`${domain}/logout`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("logout_uri", logoutUri);

  const res = NextResponse.redirect(url.toString());
  res.cookies.delete("access_token");
  res.cookies.delete("id_token");
  res.cookies.delete("refresh_token");
  return res;
}
