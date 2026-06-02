import { describe, expect, test } from "vitest";

import {
  canDisableAdmin,
  hashPassword,
  isValidUsername,
  normalizeAccountInput,
  verifyPasswordHash
} from "../src/lib/accounts";

describe("account helpers", () => {
  test("hashPassword creates a verifiable pbkdf2 hash with optional salt", () => {
    const passwordHash = hashPassword("correct horse battery staple", "fixed-salt");

    expect(passwordHash).toMatch(/^pbkdf2\.310000\.fixed-salt\.[A-Za-z0-9_-]+$/);
    expect(verifyPasswordHash("correct horse battery staple", passwordHash)).toBe(true);
    expect(verifyPasswordHash("wrong password", passwordHash)).toBe(false);
  });

  test("verifyPasswordHash supports legacy dollar-delimited hashes", () => {
    const passwordHash = hashPassword("secret", "legacy-salt").replaceAll(".", "$");

    expect(verifyPasswordHash("secret", passwordHash)).toBe(true);
    expect(verifyPasswordHash("not-secret", passwordHash)).toBe(false);
  });

  test("isValidUsername accepts lowercase usernames with underscores or dashes", () => {
    expect(isValidUsername("abc")).toBe(true);
    expect(isValidUsername("parent_1")).toBe(true);
    expect(isValidUsername("parent-user")).toBe(true);
    expect(isValidUsername("a1_23456789012345678901234567890")).toBe(true);
  });

  test("isValidUsername rejects invalid usernames", () => {
    expect(isValidUsername("ab")).toBe(false);
    expect(isValidUsername("Parent")).toBe(false);
    expect(isValidUsername("-parent")).toBe(false);
    expect(isValidUsername("parent user")).toBe(false);
    expect(isValidUsername("a1_2345678901234567890123456789012")).toBe(false);
  });

  test("normalizeAccountInput normalizes supported account fields", () => {
    expect(
      normalizeAccountInput({
        username: " Parent_One ",
        displayName: " Parent One ",
        role: "ADMIN",
        enabled: false
      })
    ).toEqual({
      username: "parent_one",
      displayName: "Parent One",
      role: "ADMIN",
      enabled: false
    });
  });

  test("normalizeAccountInput defaults unsupported role and enabled values", () => {
    expect(
      normalizeAccountInput({
        username: " Parent-Two ",
        displayName: " Parent Two ",
        role: "OWNER"
      })
    ).toEqual({
      username: "parent-two",
      displayName: "Parent Two",
      role: "PARENT",
      enabled: true
    });
  });

  test("canDisableAdmin prevents disabling self or the last enabled admin", () => {
    expect(
      canDisableAdmin({
        targetUserId: "admin-1",
        currentUserId: "admin-1",
        enabledAdminCount: 2
      })
    ).toBe(false);
    expect(
      canDisableAdmin({
        targetUserId: "admin-2",
        currentUserId: "admin-1",
        enabledAdminCount: 1
      })
    ).toBe(false);
    expect(
      canDisableAdmin({
        targetUserId: "admin-2",
        currentUserId: "admin-1",
        enabledAdminCount: 2
      })
    ).toBe(true);
  });
});
