import { PointTransactionType } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  canApplyTransaction,
  createRevisionSnapshot,
  normalizeTransactionInput,
  type TransactionInput
} from "../src/lib/transactions";

const occurredAt = new Date("2026-06-02T12:00:00.000Z");

function transactionInput(overrides: Partial<TransactionInput> = {}): TransactionInput {
  return {
    childId: "child-1",
    type: PointTransactionType.BONUS,
    itemId: "item-1",
    itemNameSnapshot: "Daily reading",
    points: 5,
    note: "Practice",
    occurredAt,
    ...overrides
  };
}

describe("canApplyTransaction", () => {
  it("allows penalties to make balance negative", () => {
    expect(
      canApplyTransaction({
        type: PointTransactionType.PENALTY,
        balanceBefore: 0,
        signedPoints: -5
      })
    ).toEqual({ ok: true });
  });

  it("rejects rewards when balance is insufficient", () => {
    expect(
      canApplyTransaction({
        type: PointTransactionType.REWARD,
        balanceBefore: 3,
        signedPoints: -5
      })
    ).toEqual({ ok: false, reason: "balance" });
  });
});

describe("normalizeTransactionInput", () => {
  it("trims note and preserves all other fields", () => {
    const input = transactionInput({ note: "  Practice note  " });

    expect(normalizeTransactionInput(input)).toEqual({
      ...input,
      note: "Practice note"
    });
  });
});

describe("createRevisionSnapshot", () => {
  it("returns a stable plain object with serialized type and occurredAt", () => {
    expect(createRevisionSnapshot(transactionInput())).toEqual({
      childId: "child-1",
      type: "BONUS",
      itemId: "item-1",
      itemNameSnapshot: "Daily reading",
      points: 5,
      note: "Practice",
      occurredAt: "2026-06-02T12:00:00.000Z"
    });
  });
});
