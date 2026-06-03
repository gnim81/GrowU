import { PointTransactionType } from "@prisma/client";
import { formatDateTime } from "@/lib/format";
import { transactionTypeLabels } from "@/lib/points";

export type CsvTransaction = {
  childName: string;
  type: PointTransactionType;
  itemNameSnapshot: string;
  points: number;
  note: string;
  occurredAt: Date;
  createdByUsername: string;
};

function escapeCsvCell(value: string | number) {
  const text = String(value);

  if (!/[",\r\n]/.test(text)) {
    return text;
  }

  return `"${text.replaceAll('"', '""')}"`;
}

export function buildTransactionsCsv(transactions: CsvTransaction[]) {
  const rows: Array<Array<string | number>> = [
    ["孩子", "类型", "项目", "分值", "备注", "发生时间", "记录人"],
    ...transactions.map((transaction) => [
      transaction.childName,
      transactionTypeLabels[transaction.type],
      transaction.itemNameSnapshot,
      transaction.points,
      transaction.note,
      formatDateTime(transaction.occurredAt),
      transaction.createdByUsername
    ])
  ];

  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}
