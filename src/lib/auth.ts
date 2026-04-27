import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, pbkdf2Sync, timingSafeEqual } from "node:crypto";

const sessionCookie = "growu_session";
const sessionMaxAgeSeconds = 60 * 60 * 24 * 14;

export type GrowuAccount = {
  username: string;
  displayName: string;
  passwordHash: string;
  enabled?: boolean;
};

export type SessionUser = {
  username: string;
  displayName: string;
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

function signPayload(payload: string) {
  return createHmac("sha256", getAuthSecret()).update(payload).digest("base64url");
}

function createSessionValue(user: SessionUser) {
  const expiresAt = Date.now() + sessionMaxAgeSeconds * 1000;
  const payload = Buffer.from(
    JSON.stringify({
      username: user.username,
      displayName: user.displayName,
      expiresAt
    })
  ).toString("base64url");

  return `${payload}.${signPayload(payload)}`;
}

function parseSessionValue(value: string): SessionUser | null {
  const [payload, signature] = value.split(".");

  if (!payload || !signature || signPayload(payload) !== signature) {
    return null;
  }

  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as
    | (SessionUser & { expiresAt: number })
    | null;

  if (!parsed || parsed.expiresAt < Date.now()) {
    return null;
  }

  return {
    username: parsed.username,
    displayName: parsed.displayName
  };
}

export function verifyPassword(password: string, passwordHash: string) {
  const parts = passwordHash.includes("$") ? passwordHash.split("$") : passwordHash.split(".");
  const [scheme, iterationsRaw, salt, expectedHash] = parts;

  if (scheme !== "pbkdf2" || !iterationsRaw || !salt || !expectedHash) {
    return false;
  }

  const iterations = Number(iterationsRaw);
  const actualHash = pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("base64url");
  const expected = Buffer.from(expectedHash);
  const actual = Buffer.from(actualHash);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
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

  cookieStore.set(sessionCookie, createSessionValue(account), {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(),
    maxAge: sessionMaxAgeSeconds,
    path: "/"
  });

  return true;
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookie);
}
