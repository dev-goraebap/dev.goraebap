import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";

interface DocsNavItem {
  label: string;
  href: string;
}

export interface DocsNavGroup {
  title?: string;
  items: DocsNavItem[];
}

interface DocsShellProps {
  label: string;
  groups: DocsNavGroup[];
  navHeader?: ReactNode;
  navFooter?: ReactNode;
  children: ReactNode;
}

export function DocsShell({ label, groups, navHeader, navFooter, children }: DocsShellProps) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname.replace(/\/$/, "") || "/",
  });
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const isOpen = openedAt === pathname;
  const current = groups.flatMap((group) => group.items).find((item) => item.href === pathname);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-6 lg:flex-row lg:gap-10 lg:py-10">
      <aside aria-label={label} className="w-full shrink-0 lg:w-60">
        <div className="space-y-5 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pb-4">
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls="docs-nav"
            onClick={() => setOpenedAt(isOpen ? null : pathname)}
            className="border-border bg-card text-foreground flex h-11 w-full cursor-pointer items-center justify-between rounded-xl border px-4 text-sm font-medium lg:hidden"
          >
            <span className="truncate">{current?.label ?? label}</span>
            <ChevronDown
              className={`text-muted-foreground size-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </button>

          <div id="docs-nav" className={`space-y-5 lg:block ${isOpen ? "block" : "hidden"}`}>
            {navHeader}
            <nav className="space-y-5">
              {groups.map((group, index) => (
                <div key={group.title ?? index} className="space-y-1">
                  {group.title && (
                    <p className="text-muted-foreground px-3 font-mono text-[11px] font-medium tracking-wide uppercase">
                      {group.title}
                    </p>
                  )}
                  <ul className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = item.href === pathname;
                      return (
                        <li key={item.href}>
                          <Link
                            to={item.href}
                            aria-current={isActive ? "page" : undefined}
                            className={
                              isActive
                                ? "bg-secondary text-foreground block rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
                                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground block rounded-full px-3 py-1.5 text-sm transition-colors"
                            }
                          >
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
              {navFooter}
            </nav>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
