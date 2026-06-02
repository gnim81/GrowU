import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions";
import { hasAnyAccount } from "@/lib/accounts";
import { getSessionUser } from "@/lib/auth";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const [user, query, anyAccount] = await Promise.all([getSessionUser(), searchParams, hasAnyAccount()]);
  const params = query ?? {};

  if (!anyAccount) {
    redirect("/setup");
  }

  if (user) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <section className="w-full max-w-sm rounded-lg border border-line bg-white p-6 shadow-soft">
        <div className="mb-6">
          <p className="text-sm font-medium text-brand">GrowU</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">成长优册</h1>
          <p className="mt-2 text-sm text-muted">登录后管理孩子积分和兑换记录。</p>
        </div>
        <form action={loginAction} className="space-y-4">
          <label className="field">
            <span className="label">用户名</span>
            <input className="input" name="username" autoComplete="username" required />
          </label>
          <label className="field">
            <span className="label">密码</span>
            <input className="input" name="password" type="password" autoComplete="current-password" required />
          </label>
          {params.error ? <p className="text-sm text-danger">账号或密码错误。</p> : null}
          <button className="btn btn-primary w-full" type="submit">
            登录
          </button>
        </form>
      </section>
    </main>
  );
}
