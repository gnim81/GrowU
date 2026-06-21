import { Home, ListChecks, LogOut, PieChart, Settings, Shield, Sparkles, Trophy, Users } from "lucide-react";
import { logoutAction } from "@/app/actions";
import { NavLink } from "@/components/nav-link";
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

const desktopItemClass = "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-brand";
const desktopActiveClass = "bg-brand-50 text-brand shadow-sm";
const mobileItemClass = "flex min-w-16 flex-1 flex-col items-center gap-1 px-2 py-2 text-xs text-slate-500 transition";
const mobileActiveClass = "text-brand";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await redirectToSetupIfNeeded();
  const user = await requireUser();
  const visibleNavItems = user.role === "ADMIN" ? [...navItems, ...adminNavItems] : navItems;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <NavLink href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-md">
              <Sparkles size={18} />
            </span>
            <span>
              <span className="block text-xs font-medium text-brand">GrowU</span>
              <span className="block text-base font-semibold text-ink">成长优册</span>
            </span>
          </NavLink>
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
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[200px_1fr]">
        <nav className="hidden md:block">
          <div className="sticky top-24 space-y-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  className={desktopItemClass}
                  activeClassName={desktopActiveClass}
                  href={item.href}
                  key={item.href}
                >
                  <Icon size={16} />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </nav>
        <main className="pb-24 md:pb-6">{children}</main>
      </div>
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex overflow-x-auto border-t border-line bg-white/90 backdrop-blur-md md:hidden">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              className={mobileItemClass}
              activeClassName={mobileActiveClass}
              href={item.href}
              key={item.href}
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
