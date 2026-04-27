import { PointTransactionType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const transactionTypeLabels: Record<PointTransactionType, string> = {
  BONUS: "加分",
  PENALTY: "减分",
  REWARD: "兑换"
};

export function normalizeSignedPoints(type: PointTransactionType, rawPoints: number) {
  const absolutePoints = Math.abs(Math.trunc(rawPoints));

  if (absolutePoints <= 0) {
    throw new Error("积分必须为正整数。");
  }

  return type === PointTransactionType.BONUS ? absolutePoints : -absolutePoints;
}

export async function getChildBalance(childId: string, excludeTransactionId?: string) {
  const result = await prisma.pointTransaction.aggregate({
    where: {
      childId,
      ...(excludeTransactionId ? { id: { not: excludeTransactionId } } : {})
    },
    _sum: {
      points: true
    }
  });

  return result._sum.points ?? 0;
}

export async function getChildCards() {
  const children = await prisma.child.findMany({
    where: { enabled: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = today.getDay() || 7;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - day + 1);

  return Promise.all(
    children.map(async (child) => {
      const [balance, todayChange, weekChange] = await Promise.all([
        prisma.pointTransaction.aggregate({
          where: { childId: child.id },
          _sum: { points: true }
        }),
        prisma.pointTransaction.aggregate({
          where: { childId: child.id, occurredAt: { gte: today } },
          _sum: { points: true }
        }),
        prisma.pointTransaction.aggregate({
          where: { childId: child.id, occurredAt: { gte: weekStart } },
          _sum: { points: true }
        })
      ]);

      return {
        ...child,
        balance: balance._sum.points ?? 0,
        todayChange: todayChange._sum.points ?? 0,
        weekChange: weekChange._sum.points ?? 0
      };
    })
  );
}

export function transactionSnapshot(transaction: {
  childId: string;
  type: PointTransactionType;
  itemId: string | null;
  itemNameSnapshot: string;
  points: number;
  note: string;
  occurredAt: Date;
}) {
  return {
    childId: transaction.childId,
    type: transaction.type,
    itemId: transaction.itemId,
    itemNameSnapshot: transaction.itemNameSnapshot,
    points: transaction.points,
    note: transaction.note,
    occurredAt: transaction.occurredAt.toISOString()
  } satisfies Prisma.InputJsonObject;
}
