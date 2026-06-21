import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Card, PageHeader } from "@/components/ui";

export default function RecordPage() {
  return (
    <>
      <PageHeader title="记录" description="选择要记录的积分类型。" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Card interactive className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-success-50 text-success">
              <ArrowUp size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink">记录加分</h2>
              <p className="mt-1 text-sm text-muted">记录表现、任务、习惯等加分事项。</p>
            </div>
          </div>
          <Link className="btn btn-primary mt-5 w-full" href="/record/bonus">
            去加分
          </Link>
        </Card>
        <Card interactive className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-danger-50 text-danger">
              <ArrowDown size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink">记录减分</h2>
              <p className="mt-1 text-sm text-muted">记录违规、拖延、未完成等扣分事项。</p>
            </div>
          </div>
          <Link className="btn btn-primary mt-5 w-full" href="/record/penalty">
            去减分
          </Link>
        </Card>
      </div>
    </>
  );
}
