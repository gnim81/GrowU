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
  const [children, rawItems] = await Promise.all([
    prisma.child.findMany({ where: { enabled: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.pointItem.findMany({
      where: { type: PointTransactionType.REWARD, enabled: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    })
  ]);
  const childNameMap = new Map(children.map((child) => [child.id, child.name] as const));
  const items = rawItems.map((item) => ({
    id: item.id,
    name: item.name,
    defaultPoints: item.defaultPoints,
    childId: item.childId,
    scopeLabel: item.childId ? `仅${childNameMap.get(item.childId) ?? "指定档案"}` : "全员"
  }));

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
