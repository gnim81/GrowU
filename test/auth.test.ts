import { createHmac } from "node:crypto";

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

  test("parseSessionValue rejects tampered signatures", () => {
    const expiresAt = new Date("2026-06-03T00:00:00.000Z").getTime();
    const sessionValue = createSessionValue(user, secret, expiresAt);
    const [payload, signature] = sessionValue.split(".");
    const tamperedSignature = `${signature.slice(0, -1)}${signature.endsWith("A") ? "B" : "A"}`;

    expect(parseSessionValue(`${payload}.${tamperedSignature}`, secret, expiresAt - 1)).toBeNull();
  });

  test("parseSessionValue rejects sessions signed with a different secret", () => {
    const expiresAt = new Date("2026-06-03T00:00:00.000Z").getTime();
    const sessionValue = createSessionValue(user, "other-test-secret-with-enough-length", expiresAt);

    expect(parseSessionValue(sessionValue, secret, expiresAt - 1)).toBeNull();
  });

  test("parseSessionValue returns null for malformed signed payloads", () => {
    const payload = Buffer.from("not-json").toString("base64url");
    const signature = createHmac("sha256", secret).update(payload).digest("base64url");

    expect(parseSessionValue(`${payload}.${signature}`, secret, Date.now())).toBeNull();
  });
});
