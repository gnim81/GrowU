import { Sparkles } from "lucide-react";
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-auth-gradient px-4 py-8">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      <section className="relative w-full max-w-sm rounded-2xl border border-white/40 bg-white/95 p-7 shadow-xl backdrop-blur">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-md">
            <Sparkles size={20} />
          </span>
          <div>
            <p className="text-xs font-medium text-brand">GrowU</p>
            <h1 className="text-xl font-semibold text-ink">初始化管理员</h1>
          </div>
        </div>
        <p className="mb-6 text-sm text-muted">创建第一个管理员账号以开始使用。</p>
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
