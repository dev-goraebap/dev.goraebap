import { cn } from 'cn';
import { useWorkItemTypes, WorkItemStatusIcon, type BoardColumn, type WorkItemRow, type WorkItemViewGrouping } from '@/entities/work-item';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { NotesIcon } from '@/shared/ui/kit/icon';
import { groupWorkItems } from '../../model/groups';
import { statusLanes } from '../../model/status-lanes';
import { KanbanColumn } from './KanbanColumn';

/** The board scrolls sideways in its own area, the page never does; its columns keep their width. A phone's board snaps to one column at a time. */
export const BOARD = 'flex min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden overscroll-x-contain p-3';
export const PHONE_BOARD = 'snap-x snap-mandatory scroll-px-3 gap-2';

/** 필터와 그룹 설정에 맞는 칼럼을 구성한다. 필터가 없는 상태 보드에는 빈 상태도 남긴다. */
export function KanbanView({ workItems, columns, grouping = 'STATUS', isNarrowed = false, showsProject, showsBacklog = false, hrefOf, onCreate }: {
  workItems: WorkItemRow[];
  columns?: readonly BoardColumn[];
  grouping?: WorkItemViewGrouping;
  isNarrowed?: boolean;
  showsProject?: boolean;
  showsBacklog?: boolean;
  hrefOf?: (workItem: WorkItemRow) => string;
  onCreate?: (columnId: string) => void;
}) {
  const isPhone = useIsMobile();
  const { types } = useWorkItemTypes();
  const groups = grouping === 'NONE'
    ? [{ id: 'all', label: '전체 업무', icon: <NotesIcon className="shrink-0 text-icon-muted" />, workItems }]
    : grouping === 'STATUS'
      ? statusLanes(workItems, columns, showsProject, !showsBacklog)
        .filter(lane => !isNarrowed || lane.workItems.length > 0)
        .map(({ column, workItems: items }) => ({ id: column.id, label: column.name,
          icon: <WorkItemStatusIcon category={column.category} />, workItems: items }))
      : groupWorkItems(workItems, grouping, columns, types, showsProject);
  return <section aria-label="보드" data-fit className={cn(BOARD, isPhone ? PHONE_BOARD : 'gap-3')}>
    {groups.map(group => <KanbanColumn key={group.id || 'none'} group={group} isPhone={isPhone}
      showsProject={showsProject} hrefOf={hrefOf} onCreate={grouping === 'STATUS' && columns ? onCreate : undefined} />)}
  </section>;
}
