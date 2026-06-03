import { beforeEach, describe, expect, test, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  userAccount: {
    count: vi.fn(),
    createMany: vi.fn()
  }
}));

vi.mock("../src/lib/prisma", () => ({
  prisma: prismaMock
}));

import { importLegacyAccounts, parseLegacyAccounts } from "../src/lib/accounts";

describe("legacy account migration helpers", () => {
  beforeEach(() => {
    prismaMock.userAccount.count.mockReset();
    prismaMock.userAccount.createMany.mockReset();
  });

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

  test("skips invalid legacy account entries", () => {
    const raw = JSON.stringify([
      {
        username: " ",
        displayName: "Blank Username",
        passwordHash: "blank-username-password-hash",
        enabled: true
      },
      {
        username: "bad username",
        displayName: "Bad Username",
        passwordHash: "bad-username-password-hash",
        enabled: true
      },
      {
        username: "blank_display",
        displayName: " ",
        passwordHash: "blank-display-password-hash",
        enabled: true
      },
      {
        username: "blank_hash",
        displayName: "Blank Hash",
        passwordHash: " ",
        enabled: true
      },
      {
        username: "valid_parent",
        displayName: "Valid Parent",
        passwordHash: "valid-password-hash",
        enabled: true
      }
    ]);

    expect(parseLegacyAccounts(raw)).toEqual([
      {
        username: "valid_parent",
        displayName: "Valid Parent",
        passwordHash: "valid-password-hash",
        role: "ADMIN",
        enabled: true
      }
    ]);
  });

  test("assigns roles after filtering invalid legacy account entries", () => {
    const raw = JSON.stringify([
      {
        username: "bad username",
        displayName: "Bad Username",
        passwordHash: "bad-username-password-hash",
        enabled: true
      },
      {
        username: "valid_admin",
        displayName: "Valid Admin",
        passwordHash: "valid-admin-password-hash",
        enabled: true
      },
      {
        username: "valid_parent",
        displayName: "Valid Parent",
        passwordHash: "valid-parent-password-hash",
        enabled: true
      }
    ]);

    expect(parseLegacyAccounts(raw).map((account) => [account.username, account.role])).toEqual([
      ["valid_admin", "ADMIN"],
      ["valid_parent", "PARENT"]
    ]);
  });

  test("returns empty list when no legacy config exists", () => {
    expect(parseLegacyAccounts(undefined)).toEqual([]);
  });

  test("skips import before parsing legacy config when database accounts already exist", async () => {
    prismaMock.userAccount.count.mockResolvedValue(1);

    await expect(importLegacyAccounts("not-json")).resolves.toEqual({ imported: 0, skipped: 0 });

    expect(prismaMock.userAccount.count).toHaveBeenCalledOnce();
    expect(prismaMock.userAccount.createMany).not.toHaveBeenCalled();
  });

  test("returns the number of inserted legacy accounts from createMany", async () => {
    const raw = JSON.stringify([
      {
        username: "valid_admin",
        displayName: "Valid Admin",
        passwordHash: "valid-admin-password-hash",
        enabled: true
      },
      {
        username: "valid_parent",
        displayName: "Valid Parent",
        passwordHash: "valid-parent-password-hash",
        enabled: true
      }
    ]);
    prismaMock.userAccount.count.mockResolvedValue(0);
    prismaMock.userAccount.createMany.mockResolvedValue({ count: 1 });

    await expect(importLegacyAccounts(raw)).resolves.toEqual({ imported: 1, skipped: 1 });

    expect(prismaMock.userAccount.createMany).toHaveBeenCalledWith({
      data: parseLegacyAccounts(raw),
      skipDuplicates: true
    });
  });
});
