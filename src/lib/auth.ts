import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "session";
const TOKEN_PAYLOAD = "authenticated";

function getSecret(): string {
  return process.env.AUTH_SECRET || "dev-secret-change-me";
}

function sign(payload: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");
}

export function checkPassword(password: string): boolean {
  return password === (process.env.APP_PASSWORD || "admin");
}

export async function createSession(): Promise<void> {
  const token = `${TOKEN_PAYLOAD}:${sign(TOKEN_PAYLOAD)}`;
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function validateSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie) return false;
  const [payload, signature] = cookie.value.split(":");
  if (!payload || !signature) return false;
  return signature === sign(payload);
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
