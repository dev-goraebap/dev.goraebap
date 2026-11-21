import { cn } from 'cn';
import { formatHours, type Cycle } from '@/entities/work-item';
import { ActionMenu, type MenuAction } from '@/shared/ui/kit/action-menu';

const shortDay = (value?: string) => (value ? new Date(`${value}T00:00:00`).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : '');

/** How much of a cycle is done, as a ring (Linear's): empty, part, or whole; under way in the accent, finished in the done mark. */
function Ring({ ratio, state }: { ratio: number; state: string }) {
  const r = 6, c = 2 * Math.PI * r;
  return <svg viewBox="0 0 16 16" width="1rem" height="1rem" aria-hidden focusable="false" className="shrink-0">
    <circle cx="8" cy="8" r={r} fill="none" strokeWidth="2" className="stroke-border" />
    <circle cx="8" cy="8" r={r} fill="none" strokeWidth="2" transform="rotate(-90 8 8)" strokeLinecap="round"
      strokeDasharray={`${c * Math.min(1, Math.max(0, ratio))} ${c}`}
      className={state === 'CURRENT' ? 'stroke-primary' : state === 'COMPLETED' ? 'stroke-mark-done' : 'stroke-muted-foreground'} />
  </svg>;
}

/**
 * A cycle's row (Linear's Cycles). The rail at its left has one day per boundary (each row's start day by the dot below,
 * the top row's end day above too) on a vertical line; then the progress ring, the name and aim, which open the project's
 * work items narrowed to the cycle; at the right where it stands, how much is done, its story points, its scope, the time
 * spent and its menu. The row under way is washed a little. A phone narrows the rail, drops the aim, points and time, and
 * puts where it stands, done and scope on a line under the name.
 */
export function CycleRow({ cycle, isFirst, label, onOpen, actions }: {
  cycle: Cycle; isFirst: boolean; label: string; onOpen: () => void; actions?: MenuAction[];
}) {
  const totals = cycle.totals;
  const scope = totals?.workItems ?? 0, done = totals?.completed ?? 0;
  const ratio = scope ? done / scope : 0;
  const percent = `${Math.round(ratio * 100)}%`;
  const state = cycle.state ?? 'UPCOMING';
  const isCurrent = state === 'CURRENT';
  const points = totals?.storyPoints ? `${totals.completedStoryPoints ?? 0}/${totals.storyPoints}점` : '';
  return <li className={cn('relative flex min-h-13 items-stretch pr-3 hover:bg-row-hover max-md:min-h-16', isCurrent ? 'bg-primary/6' : 'bg-background')}>
    <div aria-hidden className={cn(
      'relative flex w-24 shrink-0 flex-col items-end justify-between py-1 pr-4 text-xs leading-none whitespace-nowrap text-muted-foreground tabular-nums max-md:w-14 max-md:pr-3',
      // 세로선과, 아래 경계(시작날)의 점.
      "before:absolute before:inset-y-0 before:right-2.5 before:w-px before:bg-border before:content-['']",
      "after:absolute after:right-1.75 after:-bottom-1 after:z-1 after:size-1.75 after:rounded-full after:border after:border-border after:bg-background after:content-['']",
    )}>
      {/* 레일의 날짜는 경계마다 하나: 각 줄의 시작날을 아래에, 맨 위 줄만 끝날을 위에. */}
      <span className="opacity-70">{isFirst ? shortDay(cycle.endDate) : ''}</span>
      <span className="translate-y-1.5">{shortDay(cycle.startDate)}</span>
    </div>
    <button type="button" onClick={onOpen} aria-label={`${cycle.name} 업무 보기`}
      className="flex min-w-0 flex-1 items-center gap-2 px-3 text-left text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset">
      <Ring ratio={ratio} state={state} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 md:flex-row md:items-center md:gap-3">
        <span className="max-w-full shrink-0 truncate font-medium md:max-w-1/2">{cycle.name}</span>
        {cycle.goal ? <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground max-md:hidden">{cycle.goal}</span> : null}
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums md:hidden">
          <span className={cn(isCurrent && 'text-foreground')}>{label}</span>
          <span aria-hidden>·</span>
          <span>{percent} 완료</span>
          <span aria-hidden>·</span>
          <span>범위 {scope}</span>
        </span>
      </span>
    </button>
    <span className="flex shrink-0 items-center gap-4 text-xs whitespace-nowrap tabular-nums max-md:hidden">
      <span className={cn('min-w-16 text-right', isCurrent ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
      <span className="flex w-26 items-center justify-end gap-1.5">
        <Ring ratio={ratio} state={state} />
        <span>{percent}</span>
        <span className="text-muted-foreground">완료</span>
      </span>
      <span className="w-24 text-right text-muted-foreground">{points}</span>
      <span className="w-18 text-right">{scope}<span className="text-muted-foreground"> 범위</span></span>
      <span className="w-26 text-right text-muted-foreground">{totals?.spentHours ? `소요 ${formatHours(totals.spentHours)}` : ''}</span>
    </span>
    {actions ? <span className="flex shrink-0 items-center pl-2">
      <ActionMenu label={`${cycle.name} 메뉴`} title={cycle.name} size="row" actions={actions} />
    </span> : null}
  </li>;
}
