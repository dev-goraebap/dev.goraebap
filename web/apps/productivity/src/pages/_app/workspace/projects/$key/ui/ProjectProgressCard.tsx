import type { CSSProperties } from 'react';
import { cn } from 'cn';
import { CATEGORIES, type WorkItemBoardGroup } from '@/entities/work-item';

/** 업무의 진행: 상태 분류마다의 수를 한 줄 막대로, 그 아래에 분류별 수. 닫힌 것(완료) 비율을 크게 적는다. */
export function ProjectProgressCard({ groups }: { groups: WorkItemBoardGroup[] }) {
  const counts = CATEGORIES.map(category => ({ ...category, total: groups.filter(group => group.category === category.value).reduce((sum, group) => sum + group.total, 0) }));
  const total = counts.reduce((sum, each) => sum + each.total, 0);
  const done = counts.find(each => each.value === 'COMPLETED')?.total ?? 0;
  const live = total - (counts.find(each => each.value === 'CANCELED')?.total ?? 0);
  if (total === 0) return <p className="text-sm text-muted-foreground">아직 업무가 없습니다.</p>;
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-background p-4">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums">{live > 0 ? Math.round((done / live) * 100) : 0}%</span>
        <span className="text-sm text-muted-foreground tabular-nums">{`완료 ${done} / ${live}건`}</span>
      </div>
      <div role="img" aria-label={counts.map(each => `${each.label} ${each.total}건`).join(', ')} className="flex h-2 gap-0.5 overflow-hidden rounded-full">
        {counts.filter(each => each.total > 0).map(each => (
          // check-ui: allow-style 상태별 수에 비례하는 막대 폭은 데이터다.
          <span key={each.value} style={{ '--share': each.total } as CSSProperties} className={cn('grow-(--share) basis-0 bg-current', each.tone)} />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {counts.map(each => (
          <li key={each.value} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <each.icon className={cn('size-3.5', each.tone)} />
            {each.label}
            <span className="font-medium text-foreground tabular-nums">{each.total}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
