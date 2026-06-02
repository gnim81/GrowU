import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

const passwordHashIterations = 310000;
const passwordHashKeyLength = 32;
const usernamePattern = /^[a-z0-9_][a-z0-9_-]{2,31}$/;

export type AccountRole = "ADMIN" | "PARENT";

export type AccountInput = {
  username: string;
  displayName: string;
  role?: string;
  enabled?: boolean;
};

export type DisableAdminInput = {
  targetUserId: string;
  currentUserId: string;
  enabledAdminCount: number;
};

export function hashPassword(password: string, salt = randomBytes(16).toString("base64url")) {
  const hash = pbkdf2Sync(
    password,
    salt,
    passwordHashIterations,
    passwordHashKeyLength,
    "sha256"
  ).toString("base64url");

  return `pbkdf2.${passwordHashIterations}.${salt}.${hash}`;
}

export function verifyPasswordHash(password: string, passwordHash: string) {
  const parts = passwordHash.includes("$") ? passwordHash.split("$") : passwordHash.split(".");
  const [scheme, iterationsRaw, salt, expectedHash] = parts;

  if (scheme !== "pbkdf2" || !iterationsRaw || !salt || !expectedHash) {
    return false;
  }

  const iterations = Number(iterationsRaw);

  if (!Number.isSafeInteger(iterations) || iterations <= 0) {
    return false;
  }

  const actualHash = pbkdf2Sync(password, salt, iterations, passwordHashKeyLength, "sha256").toString(
    "base64url"
  );
  const expected = Buffer.from(expectedHash);
  const actual = Buffer.from(actualHash);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function isValidUsername(username: string) {
  return usernamePattern.test(username);
}

export function normalizeAccountInput(input: AccountInput) {
  const role: AccountRole = input.role === "ADMIN" || input.role === "PARENT" ? input.role : "PARENT";

  return {
    username: input.username.trim().toLowerCase(),
    displayName: input.displayName.trim(),
    role,
    enabled: typeof input.enabled === "boolean" ? input.enabled : true
  };
}

export function canDisableAdmin({
  targetUserId,
  currentUserId,
  enabledAdminCount
}: DisableAdminInput) {
  return targetUserId !== currentUserId && enabledAdminCount > 1;
}
