import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

interface AppShellNavItem {
  to: "/" | "/profile" | "/security";
  label: string;
  shortLabel: string;
  exact?: boolean;
}

interface AppShellProps {
  brand: string;
  subtitle?: string;
  navItems: AppShellNavItem[];
  sidebarExtra?: ReactNode;
  sidebarFooter?: ReactNode;
  mobileAction?: ReactNode;
  children: ReactNode;
}

/**
 * 업무 앱과 같은 인셋 앱 셸: 바닥(--sidebar) 위에 사이드바와 둥근 페이지 면(--background)을 놓습니다.
 * 64rem 미만에서는 좌측 사이드바 대신 상단 바 + 하단 탭 바로 전환합니다.
 */
export function AppShell({
  brand,
  subtitle,
  navItems,
  sidebarExtra,
  sidebarFooter,
  mobileAction,
  children,
}: AppShellProps) {
  return (
    <div className="bg-sidebar text-foreground flex min-h-screen flex-col md:h-screen md:flex-row md:overflow-hidden">
      {/* Desktop Sidebar (>= 64rem) */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between px-3 py-4 md:flex">
        <div className="space-y-6">
          <div className="px-2.5">
            <Link to="/" className="block text-sm font-semibold tracking-tight">
              {brand}
            </Link>
            {subtitle ? (
              <p className="text-muted-foreground mt-0.5 font-mono text-[11px]">{subtitle}</p>
            ) : null}
          </div>

          <nav aria-label="계정 메뉴" className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.exact }}
                className="text-muted-foreground hover:bg-accent hover:text-foreground flex h-8 items-center rounded-md px-2.5 text-sm transition-colors"
                activeProps={{
                  className: "bg-secondary text-foreground font-medium",
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {sidebarExtra}
        </div>

        {sidebarFooter ? (
          <div className="border-border/80 border-t pt-3">{sidebarFooter}</div>
        ) : null}
      </aside>

      {/* Mobile Top Bar (< 64rem) */}
      <header className="border-border bg-sidebar sticky top-0 z-20 flex h-13 items-center justify-between border-b px-4 md:hidden">
        <Link to="/" className="text-sm font-semibold tracking-tight">
          {brand}
        </Link>
        {mobileAction}
      </header>

      {/* Inset Page Surface */}
      <div className="flex min-w-0 flex-1 flex-col md:p-2 md:pl-0">
        <div className="bg-background md:border-border flex flex-1 flex-col overflow-y-auto md:rounded-2xl md:border md:shadow-xs">
          <div className="mx-auto w-full max-w-3xl flex-1 px-5 py-8 pb-24 md:px-10 md:py-10 md:pb-12">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar (< 64rem) */}
      <nav
        aria-label="하단 메뉴"
        className="border-border bg-sidebar/95 fixed inset-x-0 bottom-0 z-20 flex h-14 items-center justify-around border-t backdrop-blur-md md:hidden"
      >
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.exact }}
            className="text-muted-foreground flex flex-1 flex-col items-center justify-center py-2 text-xs font-medium transition-colors"
            activeProps={{ className: "text-foreground" }}
          >
            {item.shortLabel}
          </Link>
        ))}
      </nav>
    </div>
  );
}
