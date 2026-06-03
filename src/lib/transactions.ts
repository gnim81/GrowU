import { PointTransactionType, type Prisma } from "@prisma/client";

export interface TransactionInput {
  childId: string;
  type: PointTransactionType;
  itemId: string;
  itemNameSnapshot: string;
  points: number;
  note: string;
  occurredAt: Date;
}

export function canApplyTransaction({
  type,
  balanceBefore,
  signedPoints
}: {
  type: PointTransactionType;
  balanceBefore: number;
  signedPoints: number;
}) {
  if (type === PointTransactionType.REWARD && balanceBefore + signedPoints < 0) {
    return { ok: false as const, reason: "balance" as const };
  }

  return { ok: true as const };
}

export function normalizeTransactionInput(input: TransactionInput): TransactionInput {
  return {
    ...input,
    note: input.note.trim()
  };
}

export function createRevisionSnapshot(input: TransactionInput) {
  return {
    childId: input.childId,
    type: input.type,
    itemId: input.itemId,
    itemNameSnapshot: input.itemNameSnapshot,
    points: input.points,
    note: input.note,
    occurredAt: input.occurredAt.toISOString()
  } satisfies Prisma.InputJsonObject;
}
