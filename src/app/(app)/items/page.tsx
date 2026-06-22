import Link from "next/link";
import { PointTransactionType } from "@prisma/client";
import { Plus } from "lucide-react";
import { createItemAction, updateItemAction } from "@/app/actions";
import { ItemBindingFields } from "@/components/item-binding-fields";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { transactionTypeLabels, transactionTypeTones } from "@/lib/points";
import { prisma } from "@/lib/prisma";

const typeOptions = Object.values(PointTransactionType);

export default async function ItemsPage({
  searchParams
}: {
  searchParams?: Promise<{ itemId?: string; mode?: string; type?: string; bind?: string; error?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const [items, children] = await Promise.all([
    prisma.pointItem.findMany({
      orderBy: [{ type: "asc" }, { enabled: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
    }),
    prisma.child.findMany({
      orderBy: [{ enabled: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
    })
  ]);
  const childNameMap = new Map(children.map((child) => [child.id, child.name] as const));
  const getScopeLabel = (childId: string | null) => (childId ? `仅${childNameMap.get(childId) ?? "指定档案"}` : "全员");
  const selectedType = params.type && typeOptions.includes(params.type as PointTransactionType) ? (params.type as PointTransactionType) : "";
  const childIds = new Set(children.map((child) => child.id));
  const selectedBind = params.bind === "GLOBAL" || childIds.has(params.bind ?? "") ? (params.bind ?? "") : "";
  const filteredItems = items.filter((item) => {
    const matchesType = selectedType ? item.type === selectedType : true;
    const matchesBind = selectedBind ? (selectedBind === "GLOBAL" ? item.childId === null : item.childId === selectedBind) : true;

    return matchesType && matchesBind;
  });
  const makeItemsHref = (nextParams: Record<string, string | undefined>) => {
    const query = new URLSearchParams();

    if (selectedType) {
      query.set("type", selectedType);
    }

    if (selectedBind) {
      query.set("bind", selectedBind);
    }

    Object.entries(nextParams).forEach(([key, value]) => {
      if (value) {
        query.set(key, value);
      } else {
        query.delete(key);
      }
    });

    const queryString = query.toString();
    return queryString ? `/items?${queryString}` : "/items";
  };
  const selectedItem = filteredItems.find((item) => item.id === params.itemId) ?? filteredItems[0];
  const isCreating = params.mode === "new" || items.length === 0;
  const defaultType = selectedType || PointTransactionType.BONUS;

  return (
    <>
      <PageHeader
        title="项目管理"
        description="左侧选择项目，右侧编辑详情。停用后不再用于新增流水，历史流水继续显示创建时的项目名称快照。"
        action={
          <Link className="btn btn-primary" href={makeItemsHref({ mode: "new" })}>
            <Plus size={16} />
            新增项目
          </Link>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="p-2">
          <form action="/items" className="mb-3 space-y-3 border-b border-line p-2 pb-4">
            <label className="field">
              <span className="label">类型筛选</span>
              <select className="input" name="type" defaultValue={selectedType}>
                <option value="">全部类型</option>
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {transactionTypeLabels[type]}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="label">适用范围</span>
              <select className="input" name="bind" defaultValue={selectedBind}>
                <option value="">全部范围</option>
                <option value="GLOBAL">全员可用</option>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    仅{child.name}
                    {child.enabled ? "" : "（已停用）"}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted">
                {filteredItems.length}/{items.length} 个项目
              </span>
              <div className="flex gap-2">
                <Link className="btn btn-secondary" href="/items">
                  重置
                </Link>
                <button className="btn btn-primary" type="submit">
                  筛选
                </button>
              </div>
            </div>
          </form>
          <div className="space-y-1">
            {filteredItems.map((item) => {
              const active = !isCreating && selectedItem?.id === item.id;
              return (
                <Link
                  className={`list-item block rounded-lg px-3 py-3 text-sm transition ${
                    active ? "bg-brand-50 text-brand shadow-sm" : "text-slate-700"
                  }`}
                  href={makeItemsHref({ itemId: item.id, mode: undefined })}
                  key={item.id}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="truncate font-medium">{item.name}</span>
                    <span className="shrink-0 font-semibold">{item.defaultPoints}</span>
                  </span>
                  <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <Badge tone={transactionTypeTones[item.type]}>{transactionTypeLabels[item.type]}</Badge>
                    <span className="text-xs text-muted">{getScopeLabel(item.childId)}</span>
                    <span className="text-xs text-muted">{item.enabled ? "启用" : "停用"}</span>
                  </span>
                </Link>
              );
            })}
            {items.length === 0 ? <p className="px-3 py-8 text-center text-sm text-muted">还没有积分项目。</p> : null}
            {items.length > 0 && filteredItems.length === 0 ? <p className="px-3 py-8 text-center text-sm text-muted">没有符合筛选条件的项目。</p> : null}
          </div>
        </Card>
        {isCreating ? (
          <Card key="new-item" className="p-6">
            <h2 className="mb-5 text-lg font-semibold text-ink">新增项目</h2>
            <form action={createItemAction} className="space-y-4">
              <label className="field">
                <span className="label">类型</span>
                <select className="input" name="type" defaultValue={defaultType} required>
                  {typeOptions.map((type) => (
                    <option key={type} value={type}>
                      {transactionTypeLabels[type]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="label">名称</span>
                <input className="input" name="name" required />
              </label>
              <label className="field">
                <span className="label">默认分值</span>
                <input className="input" name="defaultPoints" type="number" min={1} defaultValue={1} required />
              </label>
              <ItemBindingFields
                children={children.map((child) => ({
                  id: child.id,
                  name: child.name,
                  enabled: child.enabled
                }))}
                defaultScope="ALL"
              />
              <label className="field">
                <span className="label">详细介绍</span>
                <textarea className="input min-h-24" name="description" />
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
        ) : selectedItem ? (
          <Card key={selectedItem.id} className="p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge tone={transactionTypeTones[selectedItem.type]}>{transactionTypeLabels[selectedItem.type]}</Badge>
                <h2 className="mt-2 text-xl font-semibold text-ink">{selectedItem.name}</h2>
              </div>
              <div className="flex gap-2">
                <Badge tone="brand">{getScopeLabel(selectedItem.childId)}</Badge>
                <Badge tone={selectedItem.enabled ? "success" : "muted"}>
                  {selectedItem.enabled ? "启用" : "停用"}
                </Badge>
              </div>
            </div>
            <form action={updateItemAction} className="space-y-4">
              <input name="id" type="hidden" value={selectedItem.id} />
              <div className="grid gap-4 sm:grid-cols-[1fr_140px_120px]">
                <label className="field">
                  <span className="label">名称</span>
                  <input className="input" name="name" defaultValue={selectedItem.name} required />
                </label>
                <label className="field">
                  <span className="label">默认分值</span>
                  <input className="input" name="defaultPoints" type="number" min={1} defaultValue={selectedItem.defaultPoints} required />
                </label>
                <label className="field">
                  <span className="label">排序</span>
                  <input className="input" name="sortOrder" type="number" defaultValue={selectedItem.sortOrder} />
                </label>
              </div>
              <ItemBindingFields
                children={children.map((child) => ({
                  id: child.id,
                  name: child.name,
                  enabled: child.enabled
                }))}
                defaultScope={selectedItem.childId ? "CHILD" : "ALL"}
                defaultChildId={selectedItem.childId}
              />
              <label className="field">
                <span className="label">详细介绍</span>
                <textarea className="input min-h-24" name="description" defaultValue={selectedItem.description} />
              </label>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input className="h-4 w-4 rounded border-line text-brand focus:shadow-glow" name="enabled" type="checkbox" defaultChecked={selectedItem.enabled} />
                  启用
                </label>
                <p className="max-w-xl text-sm text-muted">
                  取消启用等同于归档：该项目会从新增流水的选项中隐藏，已有流水仍保留并显示当时保存的项目名称快照。
                </p>
                <button className="btn btn-secondary" type="submit">
                  更新
                </button>
              </div>
            </form>
          </Card>
        ) : (
          <EmptyState title="请选择或新增一个项目。" />
        )}
      </div>
    </>
  );
}
