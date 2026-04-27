import { PointTransactionType } from "@prisma/client";
import { PageHeader } from "@/components/ui";
import { TransactionForm } from "@/components/transaction-form";
import { prisma } from "@/lib/prisma";

export default async function BonusPage({
  searchParams
}: {
  searchParams?: Promise<{ childId?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const [children, items] = await Promise.all([
    prisma.child.findMany({ where: { enabled: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.pointItem.findMany({
      where: { type: PointTransactionType.BONUS, enabled: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    })
  ]);

  return (
    <>
      <PageHeader title="记录加分" description="选择加分项目并记录实际分值。" />
      <TransactionForm type={PointTransactionType.BONUS} title="新增加分" children={children} items={items} selectedChildId={params.childId} />
    </>
  );
}
