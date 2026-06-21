"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentPropsWithoutRef } from "react";

type NavLinkProps = ComponentPropsWithoutRef<typeof Link> & {
  active?: boolean;
  activeClassName?: string;
};

/**
 * NavLink highlights itself when the current pathname matches its href.
 * Use `activeClassName` to supply the variant classes (desktop/mobile differ).
 */
export function NavLink({
  className = "",
  activeClassName = "",
  ...props
}: NavLinkProps) {
  const pathname = usePathname();
  const href = String(props.href);
  const active =
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      {...props}
      className={`${active ? activeClassName : ""} ${className}`.trim()}
      aria-current={active ? "page" : undefined}
    />
  );
}
