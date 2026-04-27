import Link from "next/link";
import { PointTransactionType } from "@prisma/client";
import { DatePresetLinks } from "@/components/date-preset-links";
import { PointsTrendChart } from "@/components/points-trend-chart";
import { Card, PageHeader } from "@/components/ui";
import { parseDateRange, validateDateRange } from "@/lib/date-range";
import { formatDateTime, formatPoints } from "@/lib/format";
import { transactionTypeLabels } from "@/lib/points";
import { prisma } from "@/lib/prisma";
import { buildTrendChartData } from "@/lib/transaction-trends";

export default async function TransactionsPage({
  searchParams
}: {
  searchParams?: Promise<{ childId?: string; type?: PointTransactionType; from?: string; to?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const children = await prisma.child.findMany({ orderBy: [{ enabled: "desc" }, { sortOrder: "asc" }] });
  const rangeValidation = validateDateRange(params.from, params.to);
  const occurredAt = rangeValidation.ok ? parseDateRange(params.from, params.to) : undefined;
  const listWhere = rangeValidation.ok
    ? {
        ...(params.childId ? { childId: params.childId } : {}),
        ...(params.type ? { type: params.type } : {}),
        ...(occurredAt ? { occurredAt } : {})
      }
    : undefined;
  const chartWhere = rangeValidation.ok
    ? {
        ...(params.childId ? { childId: params.childId } : {}),
        ...(params.type ? { type: params.type } : {}),
        ...(occurredAt?.lte ? { occurredAt: { lte: occurredAt.lte } } : {})
      }
    : undefined;
  const [transactions, chartTransactions] = await Promise.all([
    listWhere
      ? prisma.pointTransaction.findMany({
          where: listWhere,
          include: { child: true },
          orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
          take: 200
        })
      : Promise.resolve([]),
    chartWhere
      ? prisma.pointTransaction.findMany({
          where: chartWhere,
          orderBy: [{ occurredAt: "asc" }, { createdAt: "asc" }]
        })
      : Promise.resolve([])
  ]);
  const chartChildren = params.childId ? children.filter((child) => child.id === params.childId) : children;
  const chartData = rangeValidation.ok
    ? buildTrendChartData({
        children: chartChildren.map((child) => ({
          id: child.id,
          name: child.name,
          color: child.displayColor
        })),
        transactions: chartTransactions.map((transaction) => ({
          childId: transaction.childId,
          occurredAt: transaction.occurredAt,
          points: transaction.points
        })),
        rangeStart: occurredAt?.gte,
        rangeEnd: occurredAt?.lte
      })
    : null;

  const exportQuery = new URLSearchParams();
  if (params.childId) exportQuery.set("childId", params.childId);
  if (params.type) exportQuery.set("type", params.type);
  if (params.from) exportQuery.set("from", params.from);
  if (params.to) exportQuery.set("to", params.to);

  return (
    <>
      <PageHeader
        title="流水回溯"
        description="按日期倒序查看加分、减分和兑换记录。"
        action={
          <div className="flex flex-wrap gap-2">
            <Link className="btn btn-primary" href="/stats">
              查看统计
            </Link>
            <Link className="btn btn-secondary" href={`/transactions/export?${exportQuery.toString()}`}>
              导出 CSV
            </Link>
          </div>
        }
      />
      <Card className="mb-4">
        <form className="grid gap-3 md:grid-cols-5">
          <label className="field">
            <span className="label">孩子</span>
            <select className="input" name="childId" defaultValue={params.childId ?? ""}>
              <option value="">全部</option>
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="label">类型</span>
            <select className="input" name="type" defaultValue={params.type ?? ""}>
              <option value="">全部</option>
              {Object.values(PointTransactionType).map((type) => (
                <option key={type} value={type}>
                  {transactionTypeLabels[type]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="label">开始日期</span>
            <input className="input" name="from" type="date" defaultValue={params.from ?? ""} />
          </label>
          <label className="field">
            <span className="label">结束日期</span>
            <input className="input" name="to" type="date" defaultValue={params.to ?? ""} />
          </label>
          <div className="flex items-end">
            <button className="btn btn-primary w-full" type="submit">
              筛选
            </button>
          </div>
        </form>
        <div className="mt-4 border-t border-line pt-4">
          <p className="mb-2 text-sm font-medium text-slate-700">快捷区间</p>
          <DatePresetLinks pathname="/transactions" params={{ childId: params.childId, type: params.type }} />
        </div>
        {!rangeValidation.ok ? (
          <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-danger">{rangeValidation.error}</div>
        ) : null}
      </Card>
      <Card className="mb-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">积分趋势</h2>
          <p className="text-sm text-muted">
            {params.type ? `${transactionTypeLabels[params.type]}积分随时间变化` : "总积分随时间变化"}
          </p>
        </div>
        <PointsTrendChart data={chartData} />
      </Card>
      <div className="space-y-3">
        {transactions.map((transaction) => (
          <Card key={transaction.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium">
                    {transactionTypeLabels[transaction.type]}
                  </span>
                  <h2 className="text-base font-semibold text-ink">{transaction.child.name}</h2>
                  <span className="text-sm text-muted">{transaction.itemNameSnapshot}</span>
                </div>
                <p className="mt-1 text-sm text-muted">{formatDateTime(transaction.occurredAt)}</p>
                {transaction.note ? <p className="mt-2 text-sm text-slate-700">{transaction.note}</p> : null}
              </div>
              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <p className={transaction.points > 0 ? "text-xl font-semibold text-success" : "text-xl font-semibold text-danger"}>
                  {formatPoints(transaction.points)}
                </p>
                <Link className="btn btn-secondary" href={`/transactions/${transaction.id}`}>
                  详情
                </Link>
              </div>
            </div>
          </Card>
        ))}
        {transactions.length === 0 ? <Card className="text-center text-sm text-muted">暂无流水。</Card> : null}
      </div>
    </>
  );
}
