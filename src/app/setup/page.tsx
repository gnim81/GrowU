import { redirect } from "next/navigation";
import { connection } from "next/server";
import { setupAdminAction } from "@/app/actions";
import { hasAnyAccount } from "@/lib/accounts";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  await connection();

  if (await hasAnyAccount()) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <section className="card w-full max-w-sm rounded-lg border border-line bg-white p-6 shadow-soft">
        <div className="mb-6">
          <p className="text-sm font-medium text-brand">GrowU</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">初始化管理员</h1>
          <p className="mt-2 text-sm text-muted">创建第一个管理员账号以开始使用。</p>
        </div>
        <form action={setupAdminAction} className="space-y-4">
          <label className="field">
            <span className="label">用户名</span>
            <input className="input" name="username" autoComplete="username" required />
          </label>
          <label className="field">
            <span className="label">显示名称</span>
            <input className="input" name="displayName" autoComplete="name" required />
          </label>
          <label className="field">
            <span className="label">密码</span>
            <input className="input" name="password" type="password" autoComplete="new-password" required />
          </label>
          <button className="btn btn-primary w-full" type="submit">
            创建管理员
          </button>
        </form>
      </section>
    </main>
  );
}
