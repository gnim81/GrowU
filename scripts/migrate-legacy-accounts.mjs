#!/usr/bin/env node
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const usernamePattern = /^[a-z0-9_][a-z0-9_-]{2,31}$/;

function roleForImportedLegacyAccount(index) {
  return index === 0 ? "ADMIN" : "PARENT";
}

function parseLegacyAccounts(raw) {
  if (!raw) return [];
  const parsed = JSON.parse(raw);

  return parsed
    .filter((account) => account.enabled !== false)
    .map((account) => ({
      username: typeof account.username === "string" ? account.username.trim().toLowerCase() : "",
      displayName: typeof account.displayName === "string" ? account.displayName.trim() : "",
      passwordHash: typeof account.passwordHash === "string" ? account.passwordHash.trim() : ""
    }))
    .filter(
      (account) =>
        usernamePattern.test(account.username) &&
        account.displayName.length > 0 &&
        account.passwordHash.length > 0
    )
    .map((account, index) => ({
      ...account,
      role: roleForImportedLegacyAccount(index),
      enabled: true
    }));
}

try {
  const existing = await prisma.userAccount.count();

  if (existing > 0) {
    console.log(`Found ${existing} existing database account(s). Legacy import skipped.`);
  } else {
    const accounts = parseLegacyAccounts(process.env.GROWU_ACCOUNTS);

    if (accounts.length === 0) {
      console.log(
        "No enabled GROWU_ACCOUNTS entries found. Start the app and use /setup to create the first admin."
      );
    } else {
      const result = await prisma.userAccount.createMany({ data: accounts, skipDuplicates: true });
      console.log(`Imported ${result.count} legacy account(s).`);
    }
  }
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
