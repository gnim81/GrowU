import Link from "next/link";
import { PointTransactionType } from "@prisma/client";
import { Plus } from "lucide-react";
import { createItemAction, deleteItemAction, updateItemAction } from "@/app/actions";
import { ItemBindingFields } from "@/components/item-binding-fields";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { transactionTypeLabels } from "@/lib/points";
import { prisma } from "@/lib/prisma";

const typeOptions = Object.values(PointTransactionType);

export default async function ItemsPage({
  searchParams
}: {
  searchParams?: Promise<{ itemId?: string; mode?: string; type?: string; bind?: string; error?: string; deleted?: string }>;
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
  const selectedItemTransactionCount = selectedItem
    ? await prisma.pointTransaction.count({ where: { itemId: selectedItem.id } })
    : 0;

  return (
    <>
      <PageHeader
        title="项目管理"
        description="左侧选择项目，右侧编辑详情。项目停用后不会影响历史流水。"
        action={
          <Link className="btn btn-primary" href={makeItemsHref({ mode: "new" })}>
            <Plus size={16} />
            新增项目
          </Link>
        }
      />
      {params.deleted === "1" ? (
        <Card className="mb-4 border-green-200 bg-green-50">
          <p className="text-sm text-success">项目已删除。为防止误删，删除下一个项目前请重新勾选确认项。</p>
        </Card>
      ) : null}
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
                  className={`block rounded-md px-3 py-3 text-sm transition ${
                    active ? "bg-blue-50 text-brand" : "text-slate-700 hover:bg-slate-50"
                  }`}
                  href={makeItemsHref({ itemId: item.id, mode: undefined })}
                  key={item.id}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="truncate font-medium">{item.name}</span>
                    <span className="shrink-0 font-semibold">{item.defaultPoints}</span>
                  </span>
                  <span className="mt-1 flex items-center gap-2 text-xs text-muted">
                    <span>{transactionTypeLabels[item.type]}</span>
                    <span>{getScopeLabel(item.childId)}</span>
                    <span>{item.enabled ? "启用" : "停用"}</span>
                  </span>
                </Link>
              );
            })}
            {items.length === 0 ? <p className="px-3 py-8 text-center text-sm text-muted">还没有积分项目。</p> : null}
            {items.length > 0 && filteredItems.length === 0 ? <p className="px-3 py-8 text-center text-sm text-muted">没有符合筛选条件的项目。</p> : null}
          </div>
        </Card>
        {isCreating ? (
          <Card key="new-item">
            <h2 className="mb-4 text-lg font-semibold">新增项目</h2>
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
          <Card key={selectedItem.id}>
            {params.error === "itemDeleteConfirmRequired" ? (
              <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-danger">
                删除失败：请勾选全部确认项后再执行删除。
              </div>
            ) : null}
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted">{transactionTypeLabels[selectedItem.type]}</p>
                <h2 className="mt-1 text-xl font-semibold">{selectedItem.name}</h2>
              </div>
              <div className="flex gap-2">
                <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-brand">{getScopeLabel(selectedItem.childId)}</span>
                <span className={selectedItem.enabled ? "rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-success" : "rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-muted"}>
                  {selectedItem.enabled ? "启用" : "停用"}
                </span>
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
                  <input name="enabled" type="checkbox" defaultChecked={selectedItem.enabled} />
                  启用
                </label>
                <button className="btn btn-secondary" type="submit">
                  更新
                </button>
              </div>
            </form>
            <form action={deleteItemAction} className="mt-6 border-t border-line pt-4">
              <input name="id" type="hidden" value={selectedItem.id} />
              <div className="rounded-md border border-red-200 bg-red-50 p-4">
                <h3 className="text-sm font-semibold text-danger">危险操作：删除项目</h3>
                <p className="mt-2 text-sm text-slate-700">
                  当前有 {selectedItemTransactionCount} 条流水直接引用该项目。删除后不会删除历史流水，但这个项目将从可选列表中移除。
                </p>
                <div className="mt-3 space-y-2">
                  <label className="flex items-start gap-2 text-sm text-slate-800">
                    <input name="confirm_delete" type="checkbox" />
                    <span>我确认要删除项目“{selectedItem.name}”。</span>
                  </label>
                  <label className="flex items-start gap-2 text-sm text-slate-800">
                    <input name="confirm_history" type="checkbox" />
                    <span>我确认历史流水仍会保留，并继续显示当时的项目名称快照。</span>
                  </label>
                  <label className="flex items-start gap-2 text-sm text-slate-800">
                    <input name="confirm_next" type="checkbox" />
                    <span>我知道删除后页面会自动打开下一个项目，防止误删需要再次勾选确认项。</span>
                  </label>
                </div>
                <div className="mt-4 flex justify-end">
                  <button className="btn btn-danger" type="submit">
                    删除项目
                  </button>
                </div>
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
