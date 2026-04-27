import { PointTransactionType } from "@prisma/client";
import Link from "next/link";
import { DatePresetLinks } from "@/components/date-preset-links";
import { Card, PageHeader } from "@/components/ui";
import { parseDateRange, validateDateRange } from "@/lib/date-range";
import { formatPoints } from "@/lib/format";
import { transactionTypeLabels } from "@/lib/points";
import { prisma } from "@/lib/prisma";

export default async function StatsPage({
  searchParams
}: {
  searchParams?: Promise<{ childId?: string; from?: string; to?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const children = await prisma.child.findMany({ orderBy: [{ enabled: "desc" }, { sortOrder: "asc" }] });
  const rangeValidation = validateDateRange(params.from, params.to);
  const occurredAt = rangeValidation.ok ? parseDateRange(params.from, params.to) : undefined;
  const where = rangeValidation.ok
    ? {
        ...(params.childId ? { childId: params.childId } : {}),
        ...(occurredAt ? { occurredAt } : {})
      }
    : undefined;
  const [typeGroups, itemGroups] = await Promise.all([
    where
      ? prisma.pointTransaction.groupBy({
          by: ["type"],
          where,
          _sum: { points: true },
          _count: { id: true }
        })
      : Promise.resolve([]),
    where
      ? prisma.pointTransaction.groupBy({
          by: ["itemNameSnapshot"],
          where,
          _sum: { points: true },
          _count: { id: true }
        })
      : Promise.resolve([])
  ]);

  const total = typeGroups.reduce((sum, row) => sum + (row._sum.points ?? 0), 0);

  return (
    <>
      <PageHeader
        title="统计"
        description="按孩子和日期范围汇总积分变化。"
        action={
          <Link className="btn btn-secondary" href="/transactions">
            查看流水
          </Link>
        }
      />
      <Card className="mb-4">
        <form className="grid gap-3 md:grid-cols-4">
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
          <DatePresetLinks pathname="/stats" params={{ childId: params.childId }} />
        </div>
        {!rangeValidation.ok ? (
          <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-danger">{rangeValidation.error}</div>
        ) : null}
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-muted">筛选范围合计</p>
          <p className="mt-2 text-2xl font-semibold">{formatPoints(total)}</p>
        </Card>
        {Object.values(PointTransactionType).map((type) => {
          const row = typeGroups.find((group) => group.type === type);
          return (
            <Card key={type}>
              <p className="text-sm text-muted">{transactionTypeLabels[type]}</p>
              <p className="mt-2 text-2xl font-semibold">{formatPoints(row?._sum.points ?? 0)}</p>
              <p className="mt-1 text-xs text-muted">{row?._count.id ?? 0} 条</p>
            </Card>
          );
        })}
      </div>
      <Card className="mt-4">
        <h2 className="mb-4 text-lg font-semibold">项目汇总</h2>
        <div className="space-y-3">
          {itemGroups.map((group) => (
            <div className="flex items-center justify-between gap-4 border-b border-line pb-3 last:border-0 last:pb-0" key={group.itemNameSnapshot}>
              <div>
                <p className="font-medium">{group.itemNameSnapshot}</p>
                <p className="text-sm text-muted">{group._count.id} 条记录</p>
              </div>
              <p className={(group._sum.points ?? 0) >= 0 ? "font-semibold text-success" : "font-semibold text-danger"}>
                {formatPoints(group._sum.points ?? 0)}
              </p>
            </div>
          ))}
          {itemGroups.length === 0 ? <p className="text-sm text-muted">暂无统计数据。</p> : null}
        </div>
      </Card>
    </>
  );
}
