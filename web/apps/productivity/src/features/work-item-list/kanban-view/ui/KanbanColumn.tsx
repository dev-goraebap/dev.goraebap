import type { ReactNode } from 'react';
import { cn } from 'cn';
import { type WorkItemRow } from '@/entities/work-item';
import { Button } from '@/shared/ui/kit/button';
import { PlusIcon } from '@/shared/ui/kit/icon';
import type { WorkItemGroup } from '../../model/groups';
import { KanbanCard } from './KanbanCard';

/**
 * One status's column on a faint band, as tall as the board whatever it holds, its cards scrolling up and down inside it:
 * its header (icon, name, how many, and a + when the board can make work items), then its cards. A phone's column is most
 * of the width so the next one shows at the edge, and the board stops at each.
 */
export function KanbanColumn({ group, isPhone, showsProject, hrefOf, onCreate, total, footer, onElement, showsEmpty = true }: {
  group: WorkItemGroup;
  total?: number;
  onElement?: (node: HTMLElement | null) => void;
  showsEmpty?: boolean;
  footer?: ReactNode;
  isPhone: boolean;
  showsProject?: boolean;
  hrefOf?: (workItem: WorkItemRow) => string;
  onCreate?: (columnId: string) => void;
}) {
  const { workItems } = group;
  const count = total ?? workItems.length;
  return <section ref={onElement} aria-label={`${group.label} ${count}개`}
    className={cn('flex min-h-0 shrink-0 flex-col rounded-xl bg-band', isPhone ? 'w-[85%] snap-start' : 'w-72')}>
    <header className="flex h-11 shrink-0 items-center gap-2 pr-1.5 pl-3 text-sm font-medium md:h-10">
      {group.icon}
      <span className="truncate">{group.label}</span>
      <span className="font-normal text-muted-foreground tabular-nums">{count}</span>
      {onCreate
        ? <Button variant="ghost" size="icon-xs" aria-label={`${group.label}에 업무 만들기`} title="업무 만들기" className="ml-auto max-md:size-11"
          onClick={() => onCreate(group.id)}>
          <PlusIcon />
        </Button>
        : null}
    </header>
    <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
      {workItems.length === 0 && showsEmpty
        ? <li className="flex h-16 items-center justify-center text-xs text-muted-foreground">업무 없음</li>
        : workItems.map(workItem => <li key={workItem.id}><KanbanCard workItem={workItem} href={hrefOf?.(workItem)} showsProject={showsProject} /></li>)}
      {footer ? <li>{footer}</li> : null}
    </ul>
  </section>;
}
