import { useRef, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@goraebap/ui-react/components/drawer";
import { SystemIcon, type SystemIconName } from "@goraebap/ui-react/icons";
import { useIsMobile } from "@goraebap/ui-react/lib/use-is-mobile";
import { SiteFooter } from "./SiteFooter";

interface DocsNavItem {
  label: string;
  href?: string;
  icon?: SystemIconName;
  // 이름 뒤에 붙는 짧은 표시(예: AI)
  badge?: string;
  children?: DocsNavItem[];
}

export interface DocsNavGroup {
  title?: string;
  items: DocsNavItem[];
}

interface DocsShellProps {
  label: string;
  groups: DocsNavGroup[];
  // 사이드바 맨 위에 두는 요소(예: 스택 선택기)
  header?: ReactNode;
  children: ReactNode;
}

function DocsNavItemRow({ item, pathname }: { item: DocsNavItem; pathname: string }) {
  const isActive = item.href === pathname;
  const hasActiveChild = item.children?.some((child) => child.href === pathname) ?? false;
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const isOpen = manualOpen ?? (isActive || hasActiveChild);

  if (!item.children || item.children.length === 0) {
    return (
      <li>
        <Link
          to={item.href ?? "/"}
          aria-current={isActive ? "page" : undefined}
          className={
            isActive
              ? "bg-secondary text-foreground flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
              : "text-muted-foreground hover:bg-accent/60 hover:text-foreground flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors"
          }
        >
          {item.icon && <SystemIcon name={item.icon} className="size-3.5 shrink-0 opacity-80" />}
          <span className="truncate">{item.label}</span>
          {item.badge && (
            <span className="border-border text-muted-foreground ml-auto rounded-full border px-1.5 font-mono text-[0.625rem] leading-4">
              {item.badge}
            </span>
          )}
        </Link>
      </li>
    );
  }

  const parentClass = `flex w-full cursor-pointer items-center justify-between gap-2 rounded-full px-3 py-1.5 text-sm transition-colors ${
    isActive
      ? "bg-secondary text-foreground font-medium"
      : !item.href && hasActiveChild
        ? "hover:bg-accent/60 text-foreground font-medium"
        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
  }`;
  const parentContent = (
    <>
      <span className="flex min-w-0 items-center gap-2">
        {item.icon && <SystemIcon name={item.icon} className="size-3.5 shrink-0 opacity-80" />}
        <span className="truncate">{item.label}</span>
      </span>
      <SystemIcon
        name="chevronDown"
        className={`size-3.5 shrink-0 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
      />
    </>
  );

  return (
    <li>
      {item.href ? (
        <Link
          to={item.href}
          aria-current={isActive ? "page" : undefined}
          aria-expanded={isOpen}
          onClick={() => setManualOpen(!isOpen)}
          className={parentClass}
        >
          {parentContent}
        </Link>
      ) : (
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={() => setManualOpen(!isOpen)}
          className={parentClass}
        >
          {parentContent}
        </button>
      )}
      {isOpen && (
        <ul className="border-border mt-1 ml-3 space-y-0.5 border-l pl-2.5">
          {item.children.map((child) => {
            const isChildActive = child.href === pathname;
            return (
              <li key={child.href ?? child.label}>
                <Link
                  to={child.href ?? "/"}
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

function DocsNavList({ groups, pathname }: { groups: DocsNavGroup[]; pathname: string }) {
  return groups.map((group, index) => (
    <div key={group.title ?? index} className="space-y-1">
      {group.title && (
        <p className="text-muted-foreground px-3 text-xs font-semibold">{group.title}</p>
      )}
      <ul className="space-y-0.5">
        {group.items.map((item) => (
          <DocsNavItemRow key={item.href ?? item.label} item={item} pathname={pathname} />
        ))}
      </ul>
    </div>
  ));
}

function findTrail(groups: DocsNavGroup[], pathname: string) {
  for (const group of groups) {
    for (const item of group.items) {
      const match = [item, ...(item.children ?? [])].find((entry) => entry.href === pathname);
      if (match) return { section: group.title, page: match.label };
    }
  }
  return undefined;
}

export function DocsShell({ label, groups, header, children }: DocsShellProps) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname.replace(/\/$/, "") || "/",
  });
  const isMobile = useIsMobile();
  const drawerNavRef = useRef<HTMLElement>(null);
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const isOpen = isMobile && openedAt === pathname;
  const trail = findTrail(groups, pathname);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 pt-4 lg:flex-row lg:items-start lg:gap-10 lg:pt-0">
      <Drawer
        open={isOpen}
        swipeDirection="left"
        onOpenChange={(next) => setOpenedAt(next ? pathname : null)}
      >
        <DrawerTrigger
          aria-label={`${label} 열기${trail ? `, 현재 ${trail.page}` : ""}`}
          className="border-border text-muted-foreground hover:text-foreground focus-visible:outline-ring flex h-10 w-full cursor-pointer items-center gap-2 border-b text-sm focus-visible:outline-2 lg:hidden"
        >
          <SystemIcon name="workspace" className="size-4 shrink-0" />
          {trail?.section && <span className="shrink-0">{trail.section}</span>}
          {trail?.section && <SystemIcon name="chevronRight" className="size-3 shrink-0" />}
          <span className="text-foreground truncate font-medium">{trail?.page ?? label}</span>
        </DrawerTrigger>
        <DrawerContent
          side="left"
          initialFocus={() =>
            drawerNavRef.current?.querySelector<HTMLElement>('[aria-current="page"]') ?? true
          }
          className="flex w-[85%] max-w-xs flex-col p-0"
        >
          <DrawerTitle className="px-5 pt-5 pb-3">{label}</DrawerTitle>
          <nav
            ref={drawerNavRef}
            data-lenis-prevent
            aria-label={label}
            onClick={(event) => {
              if ((event.target as Element).closest("a")) setOpenedAt(null);
            }}
            className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
          >
            {header}
            <DocsNavList groups={groups} pathname={pathname} />
          </nav>
        </DrawerContent>
      </Drawer>

      <aside
        aria-label={label}
        className="relative hidden w-60 shrink-0 flex-col pt-10 pb-6 lg:sticky lg:top-[calc(3.5rem+1px)] lg:flex lg:h-[calc(100dvh-3.5rem-1px)]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-10 right-0 bottom-6 w-px"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, var(--border) 18%, var(--border) 82%, transparent 100%)",
          }}
        />
        <nav
          id="docs-nav"
          data-lenis-prevent
          className="-mt-4 min-h-0 flex-1 [scrollbar-width:none] space-y-5 overflow-y-auto overscroll-contain [mask-image:linear-gradient(to_bottom,transparent,black_1rem,black_calc(100%-2.5rem),transparent)] pt-4 pr-3 pb-10 [&::-webkit-scrollbar]:hidden"
        >
          {header}
          <DocsNavList groups={groups} pathname={pathname} />
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:min-h-[calc(100dvh-3.5rem-1px)]">
        <main className="flex-1 pb-10 [overflow-wrap:break-word] lg:py-10">{children}</main>
        <SiteFooter isContained={false} />
      </div>
    </div>
  );
}
