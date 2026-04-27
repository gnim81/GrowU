import { PointTransactionType } from "@prisma/client";
import { notFound } from "next/navigation";
import { updateTransactionAction } from "@/app/actions";
import { Card, PageHeader } from "@/components/ui";
import { formatDateInput, formatDateTime, formatPoints } from "@/lib/format";
import { transactionTypeLabels } from "@/lib/points";
import { prisma } from "@/lib/prisma";

export default async function TransactionDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const search = query ?? {};
  const [transaction, children, items] = await Promise.all([
    prisma.pointTransaction.findUnique({
      where: { id },
      include: {
        child: true,
        revisions: { orderBy: { createdAt: "desc" } }
      }
    }),
    prisma.child.findMany({ orderBy: [{ enabled: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.pointItem.findMany({ orderBy: [{ type: "asc" }, { enabled: "desc" }, { sortOrder: "asc" }] })
  ]);

  if (!transaction) {
    notFound();
  }

  const visibleItems = items.filter((item) => item.type === transaction.type);

  return (
    <>
      <PageHeader title="流水详情" description="查看流水当前值，并在记录错误时修改和保留审计。" />
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted">{transaction.child.name}</p>
              <h2 className="text-xl font-semibold">{transaction.itemNameSnapshot}</h2>
            </div>
            <p className={transaction.points > 0 ? "text-2xl font-semibold text-success" : "text-2xl font-semibold text-danger"}>
              {formatPoints(transaction.points)}
            </p>
          </div>
          <form action={updateTransactionAction} className="space-y-4">
            <input name="id" type="hidden" value={transaction.id} />
            <input name="type" type="hidden" value={transaction.type} />
            <label className="field">
              <span className="label">孩子</span>
              <select className="input" name="childId" defaultValue={transaction.childId} required>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="label">项目</span>
              <select className="input" name="itemId" defaultValue={transaction.itemId ?? ""} required>
                {visibleItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}（{item.defaultPoints}）
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="label">实际分值</span>
              <input className="input" name="points" type="number" min={1} defaultValue={Math.abs(transaction.points)} required />
            </label>
            <label className="field">
              <span className="label">发生时间</span>
              <input className="input" name="occurredAt" type="datetime-local" defaultValue={formatDateInput(transaction.occurredAt)} required />
            </label>
            <label className="field">
              <span className="label">备注</span>
              <textarea className="input min-h-24" name="note" defaultValue={transaction.note} />
            </label>
            <label className="field">
              <span className="label">修改原因</span>
              <input className="input" name="reason" required placeholder="例如：录入分值错误" />
            </label>
            {search.error === "balance" ? <p className="text-sm text-danger">修改后的兑换会导致积分不足，不能保存。</p> : null}
            <button className="btn btn-primary" type="submit">
              保存修改
            </button>
          </form>
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-semibold">修改审计</h2>
          <div className="space-y-3">
            {transaction.revisions.map((revision) => (
              <div className="rounded-md bg-slate-50 p-3" key={revision.id}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium">{revision.reason}</p>
                  <p className="shrink-0 text-xs text-muted">{formatDateTime(revision.createdAt)}</p>
                </div>
                <p className="mt-1 text-xs text-muted">修改人：{revision.editedByUsername}</p>
                <pre className="mt-3 max-h-56 overflow-auto rounded-md bg-white p-3 text-xs text-slate-700">
                  {JSON.stringify({ before: revision.beforeData, after: revision.afterData }, null, 2)}
                </pre>
              </div>
            ))}
            {transaction.revisions.length === 0 ? <p className="text-sm text-muted">暂无修改记录。</p> : null}
          </div>
        </Card>
      </div>
    </>
  );
}
