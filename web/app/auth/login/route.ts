import { NextResponse } from "next/server";
import crypto from "crypto";

function base64UrlEncode(buf: Buffer) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function GET() {
  const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI;
  const scopes = process.env.NEXT_PUBLIC_COGNITO_SCOPES || "openid email profile";

  if (!domain || !clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Missing Cognito env vars (NEXT_PUBLIC_COGNITO_DOMAIN/CLIENT_ID/REDIRECT_URI)" },
      { status: 500 }
    );
  }

  const verifier = base64UrlEncode(crypto.randomBytes(32));
  const challenge = base64UrlEncode(crypto.createHash("sha256").update(verifier).digest());

  const url = new URL(`${domain}/oauth2/authorize`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", scopes);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("code_challenge", challenge);

  const res = NextResponse.redirect(url.toString());
  res.cookies.set("pkce_verifier", verifier, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return res;
}
