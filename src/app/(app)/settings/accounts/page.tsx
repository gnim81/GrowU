import { createAccountAction, resetAccountPasswordAction, updateAccountAction } from "@/app/actions";
import { Card, PageHeader } from "@/components/ui";
import { listAccounts } from "@/lib/accounts";
import { requireAdmin } from "@/lib/auth";

const roleOptions = [
  { value: "ADMIN", label: "管理员" },
  { value: "PARENT", label: "家长" }
];

export default async function AccountsPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const params = (await searchParams) ?? {};
  const accounts = await listAccounts();

  return (
    <>
      <PageHeader title="账号管理" description="创建家长账号，调整角色与启用状态，或重置登录密码。" />
      {params.error === "lastAdmin" ? (
        <Card className="mb-4 border-red-200 bg-red-50">
          <p className="text-sm text-danger">至少需要保留一个启用的管理员，且不能停用或降级当前登录的管理员账号。</p>
        </Card>
      ) : null}
      {params.error === "password" ? (
        <Card className="mb-4 border-red-200 bg-red-50">
          <p className="text-sm text-danger">密码至少需要 8 个字符。</p>
        </Card>
      ) : null}
      {params.error === "duplicate" ? (
        <Card className="mb-4 border-red-200 bg-red-50">
          <p className="text-sm text-danger">用户名已存在，请换一个用户名后重试。</p>
        </Card>
      ) : null}
      {params.error === "missing" ? (
        <Card className="mb-4 border-red-200 bg-red-50">
          <p className="text-sm text-danger">账号不存在或已被其他人删除，请刷新后重试。</p>
        </Card>
      ) : null}
      <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">新增账号</h2>
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
              <input name="enabled" type="checkbox" defaultChecked />
              启用
            </label>
            <button className="btn btn-primary" type="submit">
              创建账号
            </button>
          </form>
        </Card>
        <div className="space-y-4">
          {accounts.map((account) => (
            <Card key={account.id}>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted">@{account.username}</p>
                  <h2 className="mt-1 text-lg font-semibold">{account.displayName}</h2>
                </div>
                <div className="flex gap-2">
                  <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-brand">
                    {account.role === "ADMIN" ? "管理员" : "家长"}
                  </span>
                  <span
                    className={
                      account.enabled
                        ? "rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-success"
                        : "rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-muted"
                    }
                  >
                    {account.enabled ? "启用" : "停用"}
                  </span>
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
                    <input name="enabled" type="checkbox" defaultChecked={account.enabled} />
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
