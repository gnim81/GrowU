import { PointTransactionType } from "@prisma/client";
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { parseDateRange } from "@/lib/date-range";
import { transactionTypeLabels } from "@/lib/points";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

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

  const rows = [
    ["孩子", "日期", "类型", "项目", "分值", "备注", "创建人", "创建时间"],
    ...transactions.map((transaction) => [
      transaction.child.name,
      transaction.occurredAt.toISOString(),
      transactionTypeLabels[transaction.type],
      transaction.itemNameSnapshot,
      transaction.points,
      transaction.note,
      transaction.createdByUsername,
      transaction.createdAt.toISOString()
    ])
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(escapeCsv).join(",")).join("\n")}`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="growu-transactions.csv"'
    }
  });
}
