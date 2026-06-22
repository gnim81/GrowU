import Link from "next/link";
import { Plus } from "lucide-react";
import { createChildAction, updateChildAction } from "@/app/actions";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { getChildBalance } from "@/lib/points";
import { prisma } from "@/lib/prisma";

export default async function ChildrenPage({
  searchParams
}: {
  searchParams?: Promise<{ childId?: string; mode?: string; error?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const children = await prisma.child.findMany({
    orderBy: [{ enabled: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
  });
  const balances = new Map(
    await Promise.all(children.map(async (child) => [child.id, await getChildBalance(child.id)] as const))
  );
  const selectedChild = children.find((child) => child.id === params.childId) ?? children[0];
  const isCreating = params.mode === "new" || children.length === 0;

  return (
    <>
      <PageHeader
        title="孩子档案"
        description="左侧选择档案，右侧编辑详情。停用后不再出现在默认记分选择中，历史流水和审计记录仍可查看。"
        action={
          <Link className="btn btn-primary" href="/children?mode=new">
            <Plus size={16} />
            新增档案
          </Link>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <Card className="p-2">
          <div className="space-y-1">
            {children.map((child) => {
              const active = !isCreating && selectedChild?.id === child.id;
              return (
                <Link
                  className={`list-item flex items-center justify-between gap-3 rounded-lg px-3 py-3 text-sm transition ${
                    active
                      ? "bg-brand-50 text-brand shadow-sm"
                      : "text-slate-700"
                  }`}
                  href={`/children?childId=${child.id}`}
                  key={child.id}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
                      style={{ backgroundColor: child.displayColor }}
                    >
                      {child.avatarText || child.name.slice(0, 1)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{child.name}</span>
                      <span className="text-xs text-muted">{child.enabled ? "启用" : "停用"}</span>
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold">{balances.get(child.id) ?? 0}</span>
                </Link>
              );
            })}
            {children.length === 0 ? <p className="px-3 py-8 text-center text-sm text-muted">还没有孩子资料。</p> : null}
          </div>
        </Card>
        {isCreating ? (
          <Card key="new-child" className="p-6">
            <h2 className="mb-5 text-lg font-semibold text-ink">新增档案</h2>
            <form action={createChildAction} className="space-y-4">
              <label className="field">
                <span className="label">姓名</span>
                <input className="input" name="name" required />
              </label>
              <label className="field">
                <span className="label">头像文字</span>
                <input className="input" name="avatarText" maxLength={2} placeholder="如：优" />
              </label>
              <label className="field">
                <span className="label">显示颜色</span>
                <input className="input h-11" name="displayColor" type="color" defaultValue="#2563EB" />
              </label>
              <label className="field">
                <span className="label">排序</span>
                <input className="input" name="sortOrder" type="number" defaultValue={0} />
              </label>
              <button className="btn btn-primary" type="submit">
                保存
              </button>
            </form>
          </Card>
        ) : selectedChild ? (
          <Card key={selectedChild.id} className="p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted">当前积分</p>
                <p className="mt-1 text-3xl font-bold text-ink">{balances.get(selectedChild.id) ?? 0}</p>
              </div>
              <Badge tone={selectedChild.enabled ? "success" : "muted"}>
                {selectedChild.enabled ? "启用" : "停用"}
              </Badge>
            </div>
            <form action={updateChildAction} className="space-y-4">
              <input name="id" type="hidden" value={selectedChild.id} />
              <label className="field">
                <span className="label">姓名</span>
                <input className="input" name="name" defaultValue={selectedChild.name} required />
              </label>
              <label className="field">
                <span className="label">头像文字</span>
                <input className="input" name="avatarText" defaultValue={selectedChild.avatarText} maxLength={2} />
              </label>
              <label className="field">
                <span className="label">显示颜色</span>
                <input className="input h-11" name="displayColor" type="color" defaultValue={selectedChild.displayColor} />
              </label>
              <label className="field">
                <span className="label">排序</span>
                <input className="input" name="sortOrder" type="number" defaultValue={selectedChild.sortOrder} />
              </label>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input className="h-4 w-4 rounded border-line text-brand focus:shadow-glow" name="enabled" type="checkbox" defaultChecked={selectedChild.enabled} />
                  启用
                </label>
                <p className="max-w-xl text-sm text-muted">
                  取消启用等同于归档：该档案不会出现在新增记录的默认选择中，已存在的流水和审计记录仍会保留并可筛选查看。
                </p>
                <button className="btn btn-secondary" type="submit">
                  更新
                </button>
              </div>
            </form>
          </Card>
        ) : (
          <EmptyState title="请选择或新增一个孩子。" />
        )}
      </div>
    </>
  );
}
