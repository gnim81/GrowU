import Link from "next/link";
import { Home, ListChecks, LogOut, PieChart, Settings, Shield, Trophy, Users } from "lucide-react";
import { logoutAction } from "@/app/actions";
import { redirectToSetupIfNeeded, requireUser } from "@/lib/auth";

const navItems = [
  { href: "/", label: "首页", icon: Home },
  { href: "/record", label: "记录", icon: ListChecks },
  { href: "/rewards/redeem", label: "兑换", icon: Trophy },
  { href: "/children", label: "档案", icon: Users },
  { href: "/items", label: "项目", icon: Settings },
  { href: "/transactions", label: "流水统计", icon: PieChart }
];

const adminNavItems = [{ href: "/settings/accounts", label: "账号", icon: Shield }];

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await redirectToSetupIfNeeded();
  const user = await requireUser();
  const visibleNavItems = user.role === "ADMIN" ? [...navItems, ...adminNavItems] : navItems;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="min-w-0">
            <p className="text-sm font-medium text-brand">GrowU</p>
            <p className="truncate text-lg font-semibold text-ink">成长优册</p>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:inline">{user.displayName}</span>
            <form action={logoutAction}>
              <button className="btn btn-secondary" type="submit" title="退出登录">
                <LogOut size={16} />
                <span className="hidden sm:inline">退出</span>
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 px-4 py-5 md:grid-cols-[180px_1fr]">
        <nav className="hidden md:block">
          <div className="sticky top-24 space-y-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white hover:text-brand"
                  href={item.href}
                  key={item.href}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
        <main className="pb-20 md:pb-4">{children}</main>
      </div>
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex overflow-x-auto border-t border-line bg-white md:hidden">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link className="flex min-w-16 flex-1 flex-col items-center gap-1 px-2 py-2 text-xs text-slate-700" href={item.href} key={item.href}>
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
