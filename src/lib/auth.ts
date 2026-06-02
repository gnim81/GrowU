import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "node:crypto";

import { verifyPasswordHash } from "./accounts";

const sessionCookie = "growu_session";
const sessionMaxAgeSeconds = 60 * 60 * 24 * 14;

export type GrowuAccount = {
  username: string;
  displayName: string;
  passwordHash: string;
  enabled?: boolean;
};

export type SessionUser = {
  userId: string;
  username: string;
  displayName: string;
  role: "ADMIN" | "PARENT";
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 24) {
    throw new Error("AUTH_SECRET must be set to a long random value.");
  }

  return secret;
}

function shouldUseSecureCookie() {
  return process.env.AUTH_COOKIE_SECURE === "true";
}

export function getAccounts() {
  const raw = process.env.GROWU_ACCOUNTS;

  if (!raw) {
    return [];
  }

  const accounts = JSON.parse(raw) as GrowuAccount[];

  return accounts.filter((account) => account.enabled !== false);
}

function signPayload(payload: string, secret = getAuthSecret()) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function signaturesMatch(actualSignature: string, expectedSignature: string) {
  const actual = Buffer.from(actualSignature);
  const expected = Buffer.from(expectedSignature);

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function createSessionValue(
  user: SessionUser,
  secret = getAuthSecret(),
  expiresAt = Date.now() + sessionMaxAgeSeconds * 1000
) {
  const payload = Buffer.from(
    JSON.stringify({
      userId: user.userId,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      expiresAt
    })
  ).toString("base64url");

  return `${payload}.${signPayload(payload, secret)}`;
}

export function parseSessionValue(value: string, secret = getAuthSecret(), now = Date.now()): SessionUser | null {
  const [payload, signature] = value.split(".");

  if (!payload || !signature || !signaturesMatch(signature, signPayload(payload, secret))) {
    return null;
  }

  let parsed: (SessionUser & { expiresAt: number }) | null;

  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as
      | (SessionUser & { expiresAt: number })
      | null;
  } catch {
    return null;
  }

  if (!parsed || parsed.expiresAt <= now) {
    return null;
  }

  return {
    userId: parsed.userId,
    username: parsed.username,
    displayName: parsed.displayName,
    role: parsed.role
  };
}

export function verifyPassword(password: string, passwordHash: string) {
  return verifyPasswordHash(password, passwordHash);
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const value = cookieStore.get(sessionCookie)?.value;

  if (!value) {
    return null;
  }

  return parseSessionValue(value);
}

export async function requireUser() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function signIn(username: string, password: string) {
  const account = getAccounts().find((item) => item.username === username);

  if (!account || !verifyPassword(password, account.passwordHash)) {
    return false;
  }

  const cookieStore = await cookies();

  cookieStore.set(
    sessionCookie,
    createSessionValue({
      userId: account.username,
      username: account.username,
      displayName: account.displayName,
      role: "ADMIN"
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: shouldUseSecureCookie(),
      maxAge: sessionMaxAgeSeconds,
      path: "/"
    }
  );

  return true;
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookie);
}
