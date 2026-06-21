import Link from "next/link";
import { ArrowDown, ArrowUp, Gift, History, Plus, Users } from "lucide-react";
import { Card, EmptyState, PageHeader, Stat } from "@/components/ui";
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
          title="还没有孩子档案"
          description="先添加一个孩子档案，就可以开始记录积分了。"
          icon={Users}
          action={
            <Link className="btn btn-primary" href="/children?mode=new">
              <Plus size={16} />
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
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-semibold text-white shadow-md"
                    style={{ backgroundColor: child.displayColor }}
                  >
                    {child.avatarText || child.name.slice(0, 1)}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-ink">{child.name}</h2>
                    <p className="text-sm text-muted">当前积分</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-ink">{child.balance}</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Stat
                  label="今日变化"
                  value={formatPoints(child.todayChange)}
                  tone={child.todayChange >= 0 ? "success" : "danger"}
                />
                <Stat
                  label="本周变化"
                  value={formatPoints(child.weekChange)}
                  tone={child.weekChange >= 0 ? "success" : "danger"}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link className="btn btn-secondary" href={`/record/bonus?childId=${child.id}`}>
                  <ArrowUp size={16} className="text-success" />
                  加分
                </Link>
                <Link className="btn btn-secondary" href={`/record/penalty?childId=${child.id}`}>
                  <ArrowDown size={16} className="text-danger" />
                  减分
                </Link>
                <Link className="btn btn-secondary" href={`/rewards/redeem?childId=${child.id}`}>
                  <Gift size={16} className="text-brand" />
                  兑换
                </Link>
                <Link className="btn btn-secondary" href={`/transactions?childId=${child.id}`}>
                  <History size={16} className="text-info" />
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
