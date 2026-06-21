import { Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { loginAction } from "@/app/actions";
import { hasAnyAccount } from "@/lib/accounts";
import { getSessionUser } from "@/lib/auth";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  await connection();

  const [user, query, anyAccount] = await Promise.all([getSessionUser(), searchParams, hasAnyAccount()]);
  const params = query ?? {};

  if (!anyAccount) {
    redirect("/setup");
  }

  if (user) {
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
            <h1 className="text-xl font-semibold text-ink">成长优册</h1>
          </div>
        </div>
        <p className="mb-6 text-sm text-muted">登录后管理孩子积分和兑换记录。</p>
        <form action={loginAction} className="space-y-4">
          <label className="field">
            <span className="label">用户名</span>
            <input className="input" name="username" autoComplete="username" required />
          </label>
          <label className="field">
            <span className="label">密码</span>
            <input className="input" name="password" type="password" autoComplete="current-password" required />
          </label>
          {params.error ? (
            <p className="badge badge-danger w-full justify-center py-1.5">账号或密码错误。</p>
          ) : null}
          <button className="btn btn-primary w-full" type="submit">
            登录
          </button>
        </form>
      </section>
    </main>
  );
}
