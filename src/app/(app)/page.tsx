import Link from "next/link";
import { ArrowDown, ArrowUp, Gift, History, Plus } from "lucide-react";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { formatPoints } from "@/lib/format";
import { getChildCards } from "@/lib/points";

export default async function DashboardPage() {
  const children = await getChildCards();

  return (
    <>
      <PageHeader
        title="首页"
        description="查看孩子当前积分，并快速记录加减分或兑换。"
      />
      {children.length === 0 ? (
        <EmptyState
          title="还没有孩子档案。"
          action={
            <Link className="btn btn-primary" href="/children?mode=new">
              添加档案
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {children.map((child) => (
            <Card key={child.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-base font-semibold text-white"
                    style={{ backgroundColor: child.displayColor }}
                  >
                    {child.avatarText || child.name.slice(0, 1)}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-ink">{child.name}</h2>
                    <p className="text-sm text-muted">当前积分</p>
                  </div>
                </div>
                <p className="text-3xl font-semibold text-ink">{child.balance}</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs text-muted">今日变化</p>
                  <p className={child.todayChange >= 0 ? "text-lg font-semibold text-success" : "text-lg font-semibold text-danger"}>
                    {formatPoints(child.todayChange)}
                  </p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs text-muted">本周变化</p>
                  <p className={child.weekChange >= 0 ? "text-lg font-semibold text-success" : "text-lg font-semibold text-danger"}>
                    {formatPoints(child.weekChange)}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link className="btn btn-secondary" href={`/record/bonus?childId=${child.id}`}>
                  <ArrowUp size={16} />
                  加分
                </Link>
                <Link className="btn btn-secondary" href={`/record/penalty?childId=${child.id}`}>
                  <ArrowDown size={16} />
                  减分
                </Link>
                <Link className="btn btn-secondary" href={`/rewards/redeem?childId=${child.id}`}>
                  <Gift size={16} />
                  兑换
                </Link>
                <Link className="btn btn-secondary" href={`/transactions?childId=${child.id}`}>
                  <History size={16} />
                  流水
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
