import { Link } from "@tanstack/react-router";
import { SystemIcon } from "@goraebap/ui-react/icons";

export interface DocLink {
  title: string;
  href: string;
}

// 문서 끝의 이전·다음 문서 링크
export function DocPager({ prevDoc, nextDoc }: { prevDoc?: DocLink; nextDoc?: DocLink }) {
  if (!prevDoc && !nextDoc) return null;
  return (
    <nav
      aria-label="이전 및 다음 문서"
      className="border-border grid gap-3 border-t pt-6 sm:grid-cols-2"
    >
      {prevDoc ? (
        <Link
          to={prevDoc.href}
          className="border-border hover:bg-accent/50 group flex flex-col gap-1 rounded-xl border px-4 py-3 transition-colors"
        >
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <SystemIcon name="chevronLeft" className="size-3.5" />
            이전
          </span>
          <span className="text-foreground text-sm font-medium">{prevDoc.title}</span>
        </Link>
      ) : (
        <div />
      )}
      {nextDoc && (
        <Link
          to={nextDoc.href}
          className="border-border hover:bg-accent/50 group flex flex-col items-end gap-1 rounded-xl border px-4 py-3 text-right transition-colors"
        >
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            다음
            <SystemIcon name="chevronRight" className="size-3.5" />
          </span>
          <span className="text-foreground text-sm font-medium">{nextDoc.title}</span>
        </Link>
      )}
    </nav>
  );
}
