import { describe, expect, test } from "vitest";

import { parseLegacyAccounts } from "../src/lib/accounts";

describe("legacy account migration helpers", () => {
  test("imports enabled legacy accounts with first account as admin", () => {
    const raw = JSON.stringify([
      {
        username: " Admin_User ",
        displayName: " Admin User ",
        passwordHash: "admin-password-hash",
        enabled: true
      },
      {
        username: " Parent_User ",
        displayName: " Parent User ",
        passwordHash: "parent-password-hash",
        enabled: true
      }
    ]);

    expect(parseLegacyAccounts(raw)).toEqual([
      {
        username: "admin_user",
        displayName: "Admin User",
        passwordHash: "admin-password-hash",
        role: "ADMIN",
        enabled: true
      },
      {
        username: "parent_user",
        displayName: "Parent User",
        passwordHash: "parent-password-hash",
        role: "PARENT",
        enabled: true
      }
    ]);
  });

  test("skips disabled legacy accounts", () => {
    const raw = JSON.stringify([
      {
        username: "disabled_parent",
        displayName: "Disabled Parent",
        passwordHash: "disabled-password-hash",
        enabled: false
      }
    ]);

    expect(parseLegacyAccounts(raw)).toEqual([]);
  });

  test("returns empty list when no legacy config exists", () => {
    expect(parseLegacyAccounts(undefined)).toEqual([]);
  });
});
