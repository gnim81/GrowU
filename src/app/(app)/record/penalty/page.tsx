import { PointTransactionType } from "@prisma/client";
import { PageHeader } from "@/components/ui";
import { TransactionForm } from "@/components/transaction-form";
import { prisma } from "@/lib/prisma";

export default async function PenaltyPage({
  searchParams
}: {
  searchParams?: Promise<{ childId?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const [children, items] = await Promise.all([
    prisma.child.findMany({ where: { enabled: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.pointItem.findMany({
      where: { type: PointTransactionType.PENALTY, enabled: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    })
  ]);

  return (
    <>
      <PageHeader title="记录减分" description="减分表单填写正整数，系统保存为负数流水。" />
      <TransactionForm type={PointTransactionType.PENALTY} title="新增减分" children={children} items={items} selectedChildId={params.childId} />
    </>
  );
}
