import { Link } from "@tanstack/react-router";

export interface SidebarSectionTab {
  label: string;
  to: string;
  active: boolean;
  badge?: string;
}

// 사이드바 최상단 영역 전환 탭(예: 프론트엔드의 엔지니어링 | 디자인 시스템 Beta).
// 하위 영역이 2개 이상인 도메인에서 도메인 헤더 아래의 세부 영역을 오가는 데 쓴다.
export function SidebarSectionTabs({
  label,
  items,
}: {
  label: string;
  items: readonly SidebarSectionTab[];
}) {
  if (items.length < 2) return null;
  return (
    <nav
      aria-label={label}
      className="border-border/70 bg-muted/50 flex items-center gap-1 rounded-lg border p-1"
    >
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          aria-current={item.active ? "page" : undefined}
          className={
            item.active
              ? "bg-background text-foreground inline-flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium whitespace-nowrap shadow-xs transition-colors"
              : "text-muted-foreground hover:text-foreground inline-flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs whitespace-nowrap transition-colors"
          }
        >
          <span>{item.label}</span>
          {item.badge && (
            <span className="bg-secondary text-muted-foreground rounded px-1 py-px font-mono text-[0.625rem] leading-tight">
              {item.badge}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
