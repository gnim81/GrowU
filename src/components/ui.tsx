import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export function Card({
  children,
  className = "",
  interactive = false
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <section
      className={`rounded-xl border border-line bg-white p-4 shadow-soft ${
        interactive ? "card-interactive" : ""
      } ${className}`}
    >
      {children}
    </section>
  );
}

export function PageHeader({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{title}</h1>
        {description ? <p className="mt-1.5 text-sm text-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  action
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <Card className="flex min-h-40 flex-col items-center justify-center gap-3 px-6 text-center">
      {Icon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand">
          <Icon size={22} />
        </div>
      ) : null}
      <div>
        <p className="text-sm font-medium text-ink">{title}</p>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {action}
    </Card>
  );
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className="text-sm font-medium text-brand" href={href}>
      {children}
    </Link>
  );
}

type BadgeTone = "brand" | "accent" | "success" | "danger" | "warning" | "info" | "muted";

export function Badge({
  tone = "muted",
  children,
  className = ""
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return <span className={`badge badge-${tone} ${className}`}>{children}</span>;
}

export function Stat({
  label,
  value,
  hint,
  tone = "muted"
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "success" | "danger" | "brand" | "muted";
}) {
  const valueTone =
    tone === "success"
      ? "text-success"
      : tone === "danger"
        ? "text-danger"
        : tone === "brand"
          ? "text-brand"
          : "text-ink";
  return (
    <div className="rounded-lg border border-line bg-slate-50/60 p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${valueTone}`}>{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
