import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { SystemIcon, type SystemIconName } from "@goraebap/ui-react/icons";
import { SiteFooter } from "./SiteFooter";

interface DocsNavItem {
  label: string;
  href: string;
  icon?: SystemIconName;
  children?: DocsNavItem[];
  defaultOpen?: boolean;
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

function DocsNavItemRow({ item, pathname }: { item: DocsNavItem; pathname: string }) {
  const isActive = item.href === pathname;
  const hasActiveChild = item.children?.some((child) => child.href === pathname) ?? false;
  const [isOpen, setIsOpen] = useState(item.defaultOpen ?? hasActiveChild);

  if (!item.children || item.children.length === 0) {
    return (
      <li>
        <Link
          to={item.href}
          aria-current={isActive ? "page" : undefined}
          className={
            isActive
              ? "bg-secondary text-foreground flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
              : "text-muted-foreground hover:bg-accent/60 hover:text-foreground flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors"
          }
        >
          {item.icon && <SystemIcon name={item.icon} className="size-3.5 shrink-0 opacity-80" />}
          <span className="truncate">{item.label}</span>
        </Link>
      </li>
    );
  }

  return (
    <li>
      <Link
        to={item.href}
        aria-current={isActive ? "page" : undefined}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={
          isActive
            ? "bg-secondary text-foreground flex w-full items-center justify-between gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground flex w-full items-center justify-between gap-2 rounded-full px-3 py-1.5 text-sm transition-colors"
        }
      >
        <span className="flex min-w-0 items-center gap-2">
          {item.icon && <SystemIcon name={item.icon} className="size-3.5 shrink-0 opacity-80" />}
          <span className="truncate">{item.label}</span>
        </span>
        <SystemIcon
          name="chevronDown"
          className={`size-3.5 shrink-0 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
        />
      </Link>
      {isOpen && (
        <ul className="border-border mt-1 ml-3 space-y-0.5 border-l pl-2.5">
          {item.children.map((child) => {
            const isChildActive = child.href === pathname;
            return (
              <li key={child.href}>
                <Link
                  to={child.href}
                  aria-current={isChildActive ? "page" : undefined}
                  className={
                    isChildActive
                      ? "bg-secondary text-foreground block rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground block rounded-full px-3 py-1.5 text-xs transition-colors"
                  }
                >
                  {child.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

export function DocsShell({ label, groups, navHeader, navFooter, children }: DocsShellProps) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname.replace(/\/$/, "") || "/",
  });
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const isOpen = openedAt === pathname;
  const current = groups
    .flatMap((group) => group.items.flatMap((item) => [item, ...(item.children ?? [])]))
    .find((item) => item.href === pathname);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 pt-6 lg:flex-row lg:items-start lg:gap-10 lg:pt-0">
      <aside
        aria-label={label}
        className="relative w-full shrink-0 lg:sticky lg:top-14 lg:flex lg:h-[calc(100vh-3.5rem)] lg:w-60 lg:flex-col lg:pt-10 lg:pb-6"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-10 right-0 bottom-6 hidden w-px lg:block"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, var(--border) 18%, var(--border) 82%, transparent 100%)",
          }}
        />
        <div className="flex min-h-0 flex-1 flex-col space-y-5 lg:pr-5">
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls="docs-nav"
            onClick={() => setOpenedAt(isOpen ? null : pathname)}
            className="border-border bg-card text-foreground flex h-11 w-full cursor-pointer items-center justify-between rounded-xl border px-4 text-sm font-medium lg:hidden"
          >
            <span className="truncate">{current?.label ?? label}</span>
            <SystemIcon
              name="chevronDown"
              className={`text-muted-foreground size-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </button>

          <div
            id="docs-nav"
            className={`min-h-0 flex-1 flex-col space-y-5 lg:flex ${isOpen ? "flex" : "hidden"}`}
          >
            {navHeader && <div className="shrink-0">{navHeader}</div>}
            <nav
              data-lenis-prevent
              className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain pr-1 pb-4"
            >
              {groups.map((group, index) => (
                <div key={group.title ?? index} className="space-y-1">
                  {group.title && (
                    <p className="text-muted-foreground px-3 text-xs font-semibold">
                      {group.title}
                    </p>
                  )}
                  <ul className="space-y-0.5">
                    {group.items.map((item) => (
                      <DocsNavItemRow key={item.href} item={item} pathname={pathname} />
                    ))}
                  </ul>
                </div>
              ))}
              {navFooter}
            </nav>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:min-h-[calc(100vh-3.5rem)]">
        <main className="flex-1 pb-10 lg:py-10">{children}</main>
        <SiteFooter isContained={false} />
      </div>
    </div>
  );
}
