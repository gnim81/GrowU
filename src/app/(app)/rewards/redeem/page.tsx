import { PointTransactionType } from "@prisma/client";
import { PageHeader } from "@/components/ui";
import { TransactionForm } from "@/components/transaction-form";
import { prisma } from "@/lib/prisma";

export default async function RedeemPage({
  searchParams
}: {
  searchParams?: Promise<{ childId?: string; error?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const [children, items] = await Promise.all([
    prisma.child.findMany({ where: { enabled: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.pointItem.findMany({
      where: { type: PointTransactionType.REWARD, enabled: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    })
  ]);

  return (
    <>
      <PageHeader title="兑换积分" description="兑换会生成负数流水，余额不足时不能提交。" />
      <TransactionForm
        type={PointTransactionType.REWARD}
        title="新增兑换"
        children={children}
        items={items}
        selectedChildId={params.childId}
        error={params.error}
      />
    </>
  );
}
