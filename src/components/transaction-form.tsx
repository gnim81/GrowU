import { PointTransactionType } from "@prisma/client";
import { createTransactionAction } from "@/app/actions";
import { TransactionChoiceFields } from "@/components/transaction-choice-fields";
import { Card } from "@/components/ui";
import { formatDateInput } from "@/lib/format";

export function TransactionForm({
  type,
  title,
  children,
  items,
  selectedChildId,
  error,
  showContinueAdding = false
}: {
  type: PointTransactionType;
  title: string;
  children: { id: string; name: string }[];
  items: { id: string; name: string; defaultPoints: number; childId: string | null; scopeLabel: string }[];
  selectedChildId?: string;
  error?: string;
  showContinueAdding?: boolean;
}) {
  return (
    <Card className="p-6">
      <h2 className="mb-5 text-lg font-semibold text-ink">{title}</h2>
      <form action={createTransactionAction.bind(null, type)} className="space-y-4">
        <TransactionChoiceFields
          children={children}
          items={items}
          selectedChildId={selectedChildId}
        />
        <label className="field">
          <span className="label">发生时间</span>
          <input className="input" name="occurredAt" type="datetime-local" defaultValue={formatDateInput()} required />
        </label>
        <label className="field">
          <span className="label">备注</span>
          <textarea className="input min-h-24" name="note" />
        </label>
        {showContinueAdding ? (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input className="h-4 w-4 rounded border-line text-brand focus:shadow-glow" name="continueAdding" type="checkbox" />
            继续添加
          </label>
        ) : null}
        {error === "balance" ? (
          <p className="badge badge-danger w-full justify-center py-1.5">当前积分不足，无法兑换。</p>
        ) : null}
        <button className="btn btn-primary w-full" type="submit">
          提交
        </button>
      </form>
    </Card>
  );
}
