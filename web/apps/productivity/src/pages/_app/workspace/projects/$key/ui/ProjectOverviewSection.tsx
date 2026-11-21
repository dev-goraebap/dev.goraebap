import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import type { Icon } from '@/shared/ui/kit/icon';

/** 한 묶음의 머리: 아이콘과 이름, 끝에 그 화면으로 가는 링크. */
export function ProjectOverviewSection({ icon: SectionIcon, title, to, more = '모두 보기', children }: {
  icon: Icon; title: string; to?: string; more?: string; children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-center gap-2">
        <SectionIcon className="size-4 text-icon-muted" />
        <h2 className="flex-1 text-sm font-semibold">{title}</h2>
        {to ? <Link to={to} className="rounded-sm text-xs text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">{more}</Link> : null}
      </header>
      {children}
    </section>
  );
}
