import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import { Prisma, type UserAccount } from "@prisma/client";

import { prisma } from "./prisma";

const passwordHashIterations = 310000;
const passwordHashKeyLength = 32;
const usernamePattern = /^[a-z0-9_][a-z0-9_-]{2,31}$/;
const initialAdminLockNamespace = 20260603;
const initialAdminLockKey = 1;
const accountAdminGuardLockNamespace = 20260603;
const accountAdminGuardLockKey = 2;

export type AccountRole = "ADMIN" | "PARENT";

export type AccountInput = {
  username: string;
  displayName: string;
  role?: string;
  enabled?: boolean;
};

export type AccountMutationInput = AccountInput & {
  password?: string;
};

export type AccountManagementError = "lastAdmin" | "password" | "duplicate" | "missing";

export type UpdateAccountWithAdminGuardResult =
  | { ok: true }
  | { ok: false; error: Extract<AccountManagementError, "lastAdmin" | "duplicate" | "missing"> };

export type DisableAdminInput = {
  targetUserId: string;
  currentUserId: string;
  enabledAdminCount: number;
};

export type AdminChangeInput = {
  currentRole: AccountRole;
  currentEnabled: boolean;
  nextRole: AccountRole;
  nextEnabled: boolean;
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

export function validateAccountMutation(input: AccountMutationInput) {
  const account = normalizeAccountInput(input);

  if (!isValidUsername(account.username)) {
    throw new Error("Username is invalid.");
  }

  if (!account.displayName) {
    throw new Error("Display name is required.");
  }

  if (typeof input.password === "string" && input.password.length > 0 && input.password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  return account;
}

export function canDisableAdmin({
  targetUserId,
  currentUserId,
  enabledAdminCount
}: DisableAdminInput) {
  return targetUserId !== currentUserId && enabledAdminCount > 1;
}

export function shouldGuardAdminChange({
  currentRole,
  currentEnabled,
  nextRole,
  nextEnabled
}: AdminChangeInput) {
  return currentRole === "ADMIN" && currentEnabled && (nextRole !== "ADMIN" || !nextEnabled);
}

export function accountManagementErrorHref(error: AccountManagementError) {
  return `/settings/accounts?error=${error}`;
}

function isPrismaKnownRequestError(error: unknown, code: string) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

export function roleForImportedLegacyAccount(index: number): AccountRole {
  return index === 0 ? "ADMIN" : "PARENT";
}

export function accountCanLogin(
  account: Pick<UserAccount, "enabled" | "passwordHash">,
  password: string
) {
  return account.enabled && verifyPasswordHash(password, account.passwordHash);
}

export async function accountCount() {
  return prisma.userAccount.count();
}

export async function listAccounts() {
  return prisma.userAccount.findMany({
    orderBy: [{ enabled: "desc" }, { role: "asc" }, { username: "asc" }, { createdAt: "asc" }]
  });
}

export async function enabledAdminCount() {
  return prisma.userAccount.count({
    where: {
      enabled: true,
      role: "ADMIN"
    }
  });
}

export async function updateAccountWithAdminGuard({
  id,
  currentUserId,
  account
}: {
  id: string;
  currentUserId: string;
  account: ReturnType<typeof normalizeAccountInput>;
}): Promise<UpdateAccountWithAdminGuardResult> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${accountAdminGuardLockNamespace}, ${accountAdminGuardLockKey})`;

    const current = await tx.userAccount.findUnique({
      where: { id }
    });

    if (!current) {
      return { ok: false, error: "missing" };
    }

    if (
      shouldGuardAdminChange({
        currentRole: current.role,
        currentEnabled: current.enabled,
        nextRole: account.role,
        nextEnabled: account.enabled
      })
    ) {
      const adminCount = await tx.userAccount.count({
        where: {
          enabled: true,
          role: "ADMIN"
        }
      });

      if (
        !canDisableAdmin({
          targetUserId: current.id,
          currentUserId,
          enabledAdminCount: adminCount
        })
      ) {
        return { ok: false, error: "lastAdmin" };
      }
    }

    try {
      await tx.userAccount.update({
        where: { id },
        data: account
      });

      return { ok: true };
    } catch (error) {
      if (isPrismaKnownRequestError(error, "P2002")) {
        return { ok: false, error: "duplicate" };
      }

      if (isPrismaKnownRequestError(error, "P2025")) {
        return { ok: false, error: "missing" };
      }

      throw error;
    }
  });
}

export async function hasAnyAccount() {
  return (await accountCount()) > 0;
}

export function assertCanCreateInitialAdmin(existingAccountCount: number) {
  if (existingAccountCount > 0) {
    throw new Error("Initial admin already exists.");
  }
}

export async function createInitialAdmin({
  username,
  displayName,
  password
}: {
  username: string;
  displayName: string;
  password: string;
}) {
  const account = normalizeAccountInput({
    username,
    displayName,
    role: "ADMIN",
    enabled: true
  });

  if (!isValidUsername(account.username)) {
    throw new Error("Username is invalid.");
  }

  if (!account.displayName) {
    throw new Error("displayName is required.");
  }

  if (!password) {
    throw new Error("password is required.");
  }

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${initialAdminLockNamespace}, ${initialAdminLockKey})`;
    const existingAccountCount = await tx.userAccount.count();
    assertCanCreateInitialAdmin(existingAccountCount);

    return tx.userAccount.create({
      data: {
        ...account,
        passwordHash: hashPassword(password)
      }
    });
  });
}

export async function findLoginAccount(username: string) {
  return prisma.userAccount.findUnique({
    where: {
      username: username.trim().toLowerCase()
    }
  });
}
