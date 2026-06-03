import { PointTransactionType } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { normalizeSignedPoints } from "../src/lib/points";

vi.mock("@/lib/prisma", () => ({
  prisma: {}
}));

describe("normalizeSignedPoints", () => {
  it("keeps bonus points positive", () => {
    expect(normalizeSignedPoints(PointTransactionType.BONUS, 5)).toBe(5);
  });

  it("stores penalty points as negative", () => {
    expect(normalizeSignedPoints(PointTransactionType.PENALTY, 5)).toBe(-5);
  });

  it("stores reward points as negative", () => {
    expect(normalizeSignedPoints(PointTransactionType.REWARD, 5)).toBe(-5);
  });
});
