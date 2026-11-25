import { useEffect, useState, type ReactNode } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { cn } from 'cn';
import { boardGroupsOptions, workItemsOptions, useWorkItemTypes, PRIORITIES, WorkItemPriorityIcon, WorkItemStatusIcon, WorkItemTypeIcon,
  type BoardColumn, type WorkItemBoardGroup, type WorkItemListing, type WorkItemRow, type WorkItemViewGrouping } from '@/entities/work-item';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { Button } from '@goraebap/ui-react/compact/button';
import { NotesIcon, ProjectsIcon, UserIcon } from '@/shared/ui/kit/icon';
import { PageState } from '@/shared/ui/kit/page-state';
import { PersonAvatar } from '@/shared/ui/person';
import { Spinner } from '@goraebap/ui-react/components/spinner';
import { listingForGroup } from '../../model/board-query';
import { kanbanGroupsInOrder } from '../../model/kanban-groups';
import { KanbanColumn } from './KanbanColumn';
import { BOARD, PHONE_BOARD } from './KanbanView';

/** 칼럼 목록·전체 건수와 카드의 커서를 분리해 읽는다. */
export function PagedKanbanView({ projectKey, listing, grouping, columns, showsProject, showsBacklog, isNarrowed, hrefOf, onCreate }: {
  projectKey?: string; listing: WorkItemListing; grouping: WorkItemViewGrouping; columns?: readonly BoardColumn[];
  showsProject?: boolean; showsBacklog?: boolean; isNarrowed: boolean; hrefOf?: (item: WorkItemRow) => string; onCreate?: (columnId: string) => void;
}) {
  const isPhone = useIsMobile();
  const { types } = useWorkItemTypes();
  const query = useQuery(boardGroupsOptions(projectKey, listing, grouping));
  if (query.isPending) return <p role="status" className="p-4 text-sm text-muted-foreground">불러오는 중…</p>;
  if (query.error) return <PageState kind="error" title="칸반을 불러오지 못했습니다" description={query.error.message}
    action={<Button variant="secondary" onClick={() => void query.refetch()}>다시 시도</Button>} />;
  const groups = kanbanGroupsInOrder(query.data ?? [], grouping, columns, types, !!showsProject, isNarrowed, showsBacklog);
  if (isNarrowed && !groups.some(group => group.total > 0)) return <PageState kind="search" title="조건에 맞는 업무가 없습니다" />;
  const mark = (group: WorkItemBoardGroup) => {
    switch (grouping) {
      case 'STATUS': return <WorkItemStatusIcon category={group.category ?? 'UNSTARTED'} />;
      case 'PRIORITY': return <WorkItemPriorityIcon priority={group.id as WorkItemRow['priority']} />;
      case 'TYPE': return <WorkItemTypeIcon type={group.id} />;
      case 'ASSIGNEE': return group.id === 'none' ? <UserIcon className="shrink-0 text-icon-muted opacity-50" /> : <PersonAvatar id={group.id} name={group.name} size={20} />;
      case 'PROJECT': return <ProjectsIcon className="shrink-0 text-icon-muted" />;
      default: return <NotesIcon className="shrink-0 text-icon-muted" />;
    }
  };
  const nameOf = (group: WorkItemBoardGroup) => grouping === 'PRIORITY' ? PRIORITIES.find(p => p.value === group.id)?.label ?? group.name
    : grouping === 'TYPE' ? types.find(t => t.code === group.id)?.name ?? group.name : group.name;
  return <section aria-label="보드" data-fit className={cn(BOARD, isPhone ? PHONE_BOARD : 'gap-3')}>
    {groups.map(group => <PagedColumn key={`${grouping}:${group.id}`} group={group} label={nameOf(group)} icon={mark(group)} grouping={grouping}
      projectKey={projectKey} listing={listing} isPhone={isPhone} showsProject={showsProject} hrefOf={hrefOf}
      onCreate={grouping === 'STATUS' && !showsProject ? onCreate : undefined} />)}
  </section>;
}

function PagedColumn({ group, label, icon, grouping, projectKey, listing, isPhone, showsProject, hrefOf, onCreate }: {
  group: WorkItemBoardGroup; label: string; icon: ReactNode; grouping: WorkItemViewGrouping; projectKey?: string; listing: WorkItemListing;
  isPhone: boolean; showsProject?: boolean; hrefOf?: (item: WorkItemRow) => string; onCreate?: (columnId: string) => void;
}) {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [isVisible, setVisible] = useState(false);
  useEffect(() => {
    if (!element || isVisible) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element, isVisible]);
  const narrowed = listingForGroup(listing, grouping, group);
  const query = useInfiniteQuery({ ...workItemsOptions(projectKey, narrowed, 30), placeholderData: undefined, enabled: group.total > 0 && isVisible });
  const items = query.data?.pages.flatMap(page => page.items) ?? [];
  return <KanbanColumn onElement={setElement} showsEmpty={group.total === 0 || !query.isPending && !query.error} group={{ id: group.id, label, icon, workItems: items }} total={group.total} isPhone={isPhone}
    showsProject={showsProject} hrefOf={hrefOf} onCreate={onCreate}
    footer={<div className="flex flex-col items-center gap-2 py-2 text-xs">
      {group.total > 0 && query.isPending ? <p role="status" className="text-muted-foreground">불러오는 중…</p> : null}
      {query.error ? <>
        <p role="alert" className="text-destructive">업무를 불러오지 못했습니다</p>
        <Button variant="secondary" size="sm" onClick={() => void (items.length ? query.fetchNextPage() : query.refetch())}>다시 시도</Button>
      </> : null}
      {query.hasNextPage ? <>
        <p className="text-muted-foreground tabular-nums">{items.length} / {group.total}개</p>
        <Button variant="secondary" size="sm" className="rounded-full max-md:h-11 max-md:px-5" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>
          {query.isFetchingNextPage ? <Spinner data-icon="inline-start" /> : null}
          더 불러오기
        </Button>
      </> : null}
    </div>} />;
}
