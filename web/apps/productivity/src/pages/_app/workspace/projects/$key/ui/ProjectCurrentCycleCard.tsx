import type { CSSProperties } from 'react';
import type { Cycle } from '@/entities/work-item';

const shortDay = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' });

/** 진행 중인 사이클: 이름 · 기간과 끝낸 업무의 비율. */
export function ProjectCurrentCycleCard({ cycle }: { cycle: Cycle }) {
  const all = cycle.totals?.workItems ?? 0;
  const done = cycle.totals?.completed ?? 0;
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-background p-4">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate font-medium">{cycle.name}</span>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {cycle.startDate && cycle.endDate ? `${shortDay.format(new Date(cycle.startDate))} ~ ${shortDay.format(new Date(cycle.endDate))}` : ''}
        </span>
      </div>
      {cycle.goal ? <p className="truncate text-sm text-muted-foreground">{cycle.goal}</p> : null}
      <div className="flex items-center gap-3">
        <span className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          {/* check-ui: allow-style 끝낸 비율만큼의 막대 폭은 데이터다. */}
          <span style={{ '--done': all > 0 ? done / all : 0 } as CSSProperties} className="w-[calc(var(--done)*100%)] rounded-full bg-current text-mark-done" />
        </span>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{`${done} / ${all}건`}</span>
      </div>
    </div>
  );
}
