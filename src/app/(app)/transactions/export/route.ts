import { PointTransactionType } from "@prisma/client";
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { buildTransactionsCsv } from "@/lib/csv";
import { parseDateRange } from "@/lib/date-range";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  await requireUser();

  const params = request.nextUrl.searchParams;
  const childId = params.get("childId") || undefined;
  const type = (params.get("type") || undefined) as PointTransactionType | undefined;
  const from = params.get("from") || undefined;
  const to = params.get("to") || undefined;
  const occurredAt = parseDateRange(from, to);

  const transactions = await prisma.pointTransaction.findMany({
    where: {
      ...(childId ? { childId } : {}),
      ...(type ? { type } : {}),
      ...(occurredAt ? { occurredAt } : {})
    },
    include: { child: true },
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }]
  });

  const csv = buildTransactionsCsv(
    transactions.map((transaction) => ({
      childName: transaction.child.name,
      type: transaction.type,
      itemNameSnapshot: transaction.itemNameSnapshot,
      points: transaction.points,
      note: transaction.note,
      occurredAt: transaction.occurredAt,
      createdByUsername: transaction.createdByUsername
    }))
  );

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="growu-transactions.csv"'
    }
  });
}
