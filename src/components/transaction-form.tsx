import { PointItem, PointTransactionType } from "@prisma/client";
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
  error
}: {
  type: PointTransactionType;
  title: string;
  children: { id: string; name: string }[];
  items: PointItem[];
  selectedChildId?: string;
  error?: string;
}) {
  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <form action={createTransactionAction.bind(null, type)} className="space-y-4">
        <TransactionChoiceFields
          children={children}
          items={items.map((item) => ({ id: item.id, name: item.name, defaultPoints: item.defaultPoints }))}
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
        {error === "balance" ? <p className="text-sm text-danger">当前积分不足，无法兑换。</p> : null}
        <button className="btn btn-primary w-full" type="submit">
          提交
        </button>
      </form>
    </Card>
  );
}
