import { NextRequest, NextResponse } from "next/server";

async function validateToken(token: string): Promise<boolean> {
  const [payload, signature] = token.split(":");
  if (!payload || !signature) return false;

  const secret = process.env.AUTH_SECRET || "dev-secret-change-me";
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return signature === expected;
}

export async function middleware(req: NextRequest) {
  const session = req.cookies.get("session");
  const isValid = session ? await validateToken(session.value) : false;

  if (!isValid) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
