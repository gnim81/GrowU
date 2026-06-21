import { AlertCircle } from "lucide-react";
import { createAccountAction, resetAccountPasswordAction, updateAccountAction } from "@/app/actions";
import { Badge, Card, PageHeader } from "@/components/ui";
import { listAccounts } from "@/lib/accounts";
import { requireAdmin } from "@/lib/auth";

const roleOptions = [
  { value: "ADMIN", label: "管理员" },
  { value: "PARENT", label: "家长" }
];

const errorMessages: Record<string, string> = {
  lastAdmin: "至少需要保留一个启用的管理员，且不能停用或降级当前登录的管理员账号。",
  password: "密码至少需要 8 个字符。",
  duplicate: "用户名已存在，请换一个用户名后重试。",
  missing: "账号不存在或已被其他人删除，请刷新后重试。"
};

export default async function AccountsPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const params = (await searchParams) ?? {};
  const accounts = await listAccounts();
  const errorMessage = params.error ? errorMessages[params.error] : undefined;

  return (
    <>
      <PageHeader title="账号管理" description="创建家长账号，调整角色与启用状态，或重置登录密码。" />
      {errorMessage ? (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-danger/20 bg-danger-50 px-4 py-3 text-sm text-danger">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>{errorMessage}</p>
        </div>
      ) : null}
      <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
        <Card className="p-6">
          <h2 className="mb-5 text-lg font-semibold text-ink">新增账号</h2>
          <form action={createAccountAction} className="space-y-4">
            <label className="field">
              <span className="label">用户名</span>
              <input className="input" name="username" minLength={3} maxLength={32} required />
            </label>
            <label className="field">
              <span className="label">显示名称</span>
              <input className="input" name="displayName" required />
            </label>
            <label className="field">
              <span className="label">初始密码</span>
              <input className="input" name="password" type="password" minLength={8} required />
            </label>
            <label className="field">
              <span className="label">角色</span>
              <select className="input" name="role" defaultValue="PARENT">
                {roleOptions.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input className="h-4 w-4 rounded border-line text-brand focus:shadow-glow" name="enabled" type="checkbox" defaultChecked />
              启用
            </label>
            <button className="btn btn-primary" type="submit">
              创建账号
            </button>
          </form>
        </Card>
        <div className="space-y-4">
          {accounts.map((account) => (
            <Card key={account.id} className="p-6">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted">@{account.username}</p>
                  <h2 className="mt-1 text-lg font-semibold text-ink">{account.displayName}</h2>
                </div>
                <div className="flex gap-2">
                  <Badge tone={account.role === "ADMIN" ? "accent" : "info"}>
                    {account.role === "ADMIN" ? "管理员" : "家长"}
                  </Badge>
                  <Badge tone={account.enabled ? "success" : "muted"}>
                    {account.enabled ? "启用" : "停用"}
                  </Badge>
                </div>
              </div>
              <form action={updateAccountAction} className="space-y-4">
                <input name="id" type="hidden" value={account.id} />
                <div className="grid gap-4 lg:grid-cols-[1fr_1fr_140px]">
                  <label className="field">
                    <span className="label">用户名</span>
                    <input
                      className="input"
                      name="username"
                      defaultValue={account.username}
                      minLength={3}
                      maxLength={32}
                      required
                    />
                  </label>
                  <label className="field">
                    <span className="label">显示名称</span>
                    <input className="input" name="displayName" defaultValue={account.displayName} required />
                  </label>
                  <label className="field">
                    <span className="label">角色</span>
                    <select className="input" name="role" defaultValue={account.role}>
                      {roleOptions.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input className="h-4 w-4 rounded border-line text-brand focus:shadow-glow" name="enabled" type="checkbox" defaultChecked={account.enabled} />
                    启用
                  </label>
                  <button className="btn btn-secondary" type="submit">
                    更新账号
                  </button>
                </div>
              </form>
              <form action={resetAccountPasswordAction} className="mt-5 border-t border-line pt-4">
                <input name="id" type="hidden" value={account.id} />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <label className="field flex-1">
                    <span className="label">重置密码</span>
                    <input className="input" name="password" type="password" minLength={8} required />
                  </label>
                  <button className="btn btn-secondary" type="submit">
                    保存新密码
                  </button>
                </div>
              </form>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
