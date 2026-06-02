import { describe, expect, test } from "vitest";

import { createSessionValue, parseSessionValue, type SessionUser } from "../src/lib/auth";

describe("session helpers", () => {
  const secret = "test-secret-with-enough-length";
  const user: SessionUser = {
    userId: "user-1",
    username: "parent",
    displayName: "Parent User",
    role: "ADMIN"
  };

  test("createSessionValue and parseSessionValue round-trip a signed session", () => {
    const expiresAt = new Date("2026-06-03T00:00:00.000Z").getTime();
    const sessionValue = createSessionValue(user, secret, expiresAt);

    expect(parseSessionValue(sessionValue, secret, expiresAt - 1)).toEqual(user);
  });

  test("parseSessionValue rejects expired sessions", () => {
    const expiresAt = new Date("2026-06-03T00:00:00.000Z").getTime();
    const sessionValue = createSessionValue(user, secret, expiresAt);

    expect(parseSessionValue(sessionValue, secret, expiresAt)).toBeNull();
  });
});
