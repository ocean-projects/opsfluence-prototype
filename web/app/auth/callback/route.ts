import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/", req.url));

  const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI;
  const verifier = req.cookies.get("pkce_verifier")?.value;

  if (!domain || !clientId || !redirectUri) {
    return NextResponse.redirect(new URL("/?error=missing_env", req.url));
  }
  if (!verifier) {
    return NextResponse.redirect(new URL("/?error=missing_pkce", req.url));
  }

  const tokenUrl = `${domain}/oauth2/token`;

  const body = new URLSearchParams();
  body.set("grant_type", "authorization_code");
  body.set("client_id", clientId);
  body.set("code", code);
  body.set("redirect_uri", redirectUri);
  body.set("code_verifier", verifier);

  const tokenResp = await fetch(tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!tokenResp.ok) {
    const t = await tokenResp.text();
    console.error("Token exchange failed:", t);
    return NextResponse.redirect(new URL("/?error=token_exchange", req.url));
  }

  const tokens = (await tokenResp.json()) as {
    access_token: string;
    id_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
  };

  const res = NextResponse.redirect(new URL("/dashboard", req.url));
  res.cookies.delete("pkce_verifier");

  res.cookies.set("access_token", tokens.access_token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  res.cookies.set("id_token", tokens.id_token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  if (tokens.refresh_token) {
    res.cookies.set("refresh_token", tokens.refresh_token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  return res;
}
