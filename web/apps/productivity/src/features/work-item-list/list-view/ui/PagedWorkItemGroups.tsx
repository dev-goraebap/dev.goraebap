import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { boardGroupsOptions, PRIORITIES, useWorkItemTypes, WorkItemPriorityIcon, WorkItemStatusIcon, WorkItemTypeIcon,
  type BoardColumn, type WorkItemBoardGroup, type WorkItemListing, type WorkItemRow, type WorkItemTypeRow, type WorkItemViewGrouping } from '@/entities/work-item';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { Button } from '@/shared/ui/kit/button';
import { ProjectsIcon, UserIcon } from '@/shared/ui/kit/icon';
import { PageState } from '@/shared/ui/kit/page-state';
import { PersonAvatar } from '@/shared/ui/person';
import { Spinner } from '@/shared/ui/kit/spinner';
import { listGroupPageOptions, listGroupsInOrder } from '../../model/list-group-pages';
import { WorkItemGroupView } from './WorkItemGroupView';
import { WorkItemTree } from './WorkItemTree';

type GroupQuery = { projectKey?: string; listing: WorkItemListing; grouping: WorkItemViewGrouping };
type RowDisplay = { showsProject?: boolean; hrefOf?: (item: WorkItemRow) => string };

/**
 * A grouped list read group by group: the groups and their totals first (one request), then each group's rows a slice at a
 * time once it comes near the screen, with 더 보기 under a group that has more.
 */
export function PagedWorkItemGroups({ projectKey, listing, grouping, columns = [], showsProject, hrefOf, onCreate,
  isNarrowed, onClear, create, empty, isFolded }: GroupQuery & RowDisplay & {
  columns?: readonly BoardColumn[]; onCreate?: (id: string) => void; isNarrowed: boolean; onClear: () => void;
  create?: { label: string; onClick?: () => void }; empty: { title: string; description?: string };
  /** 처음에 접어 둘 묶음(내 업무의 끝난 것처럼 덜 보는 묶음). 비우면 모두 펴 둔다. */
  isFolded?: (group: WorkItemBoardGroup) => boolean;
}) {
  const isPhone = useIsMobile();
  const { types } = useWorkItemTypes();
  const query = useQuery(boardGroupsOptions(projectKey, listing, grouping));
  if (query.isPending) return <div className="flex justify-center p-6"><Spinner aria-label="업무 그룹을 불러오는 중" /></div>;
  if (query.isLoadingError) return <PageState kind="error" title="업무를 불러오지 못했습니다" description={query.error.message}
    action={<Button variant="secondary" onClick={() => void query.refetch()}>다시 시도</Button>} />;
  const groups = listGroupsInOrder(query.data ?? [], grouping, columns, types, !!showsProject);
  if (!groups.length) return isNarrowed
    ? <PageState kind="search" title="조건에 맞는 업무가 없습니다"
      action={<Button variant="secondary" onClick={onClear}>조건 지우기</Button>} />
    : <PageState kind="empty" {...empty} action={create ? <Button variant="create" onClick={create.onClick}>{create.label}</Button> : undefined} />;
  return <div className="flex flex-col">
    {groups.map(group => <WorkItemGroupView key={`${grouping}:${group.id}`} group={headingOf(group, grouping, types)}
      count={group.total} onCreate={onCreate} isInitiallyOpen={!isFolded?.(group)}>
      <GroupRows group={group} projectKey={projectKey} listing={listing} grouping={grouping}
        isPhone={isPhone} showsProject={showsProject} hrefOf={hrefOf} />
    </WorkItemGroupView>)}
  </div>;
}

function headingOf({ id, name, category }: WorkItemBoardGroup, grouping: WorkItemViewGrouping, types: readonly WorkItemTypeRow[]) {
  switch (grouping) {
    case 'STATUS':
      return { id, label: name, icon: <WorkItemStatusIcon category={category ?? 'UNSTARTED'} /> };
    case 'PRIORITY':
      return { id, label: id === 'NONE' ? '우선순위 없음' : PRIORITIES.find(p => p.value === id)?.label ?? name,
        icon: <WorkItemPriorityIcon priority={id as WorkItemRow['priority']} /> };
    case 'TYPE':
      return { id, label: types.find(type => type.code === id)?.name ?? name, icon: <WorkItemTypeIcon type={id} /> };
    case 'ASSIGNEE':
      return { id, label: name, icon: id === 'none' ? <UserIcon className="shrink-0 text-icon-muted opacity-50" />
        : <PersonAvatar id={id} name={name} size="xsm" isStatic /> };
    default:
      return { id, label: name, icon: <ProjectsIcon className="shrink-0 text-icon-muted" /> };
  }
}

function GroupRows({ group, projectKey, listing, grouping, isPhone, showsProject, hrefOf }:
  GroupQuery & RowDisplay & { group: WorkItemBoardGroup; isPhone: boolean }) {
  const body = useRef<HTMLDivElement>(null);
  const [nearby, setNearby] = useState(false);
  useEffect(() => {
    if (nearby || !body.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setNearby(true); observer.disconnect(); }
    }, { rootMargin: '240px 0px' });
    observer.observe(body.current);
    return () => observer.disconnect();
  }, [nearby]);

  const query = useInfiniteQuery({ ...listGroupPageOptions(projectKey, listing, grouping, group), enabled: nearby });
  const items = query.data?.pages.flatMap(page => page.items) ?? [];
  const more = () => { if (!query.isFetching) void query.fetchNextPage(); };
  return <div ref={body} className="flex flex-col">
    {items.length > 0 ? <WorkItemTree items={items} isPhone={isPhone} showsProject={showsProject} hrefOf={hrefOf} /> : null}
    {query.isPending ? <p className="p-3 text-center text-xs text-muted-foreground" role={nearby ? 'status' : undefined}>불러오는 중…</p>
      : query.isLoadingError || query.isFetchNextPageError ? <div className="flex items-center justify-center gap-2 p-3">
        <p role="alert" className="text-xs text-destructive">업무를 불러오지 못했습니다.</p>
        <Button variant="secondary" size="sm" disabled={query.isFetching}
          onClick={() => query.isFetchNextPageError ? more() : void query.refetch()}>
          {query.isFetching ? <Spinner data-icon="inline-start" /> : null}
          다시 시도
        </Button>
      </div>
      : query.hasNextPage ? <div className="flex justify-center p-3">
        <Button variant="secondary" size="sm" className="rounded-full max-md:h-11 max-md:px-5" disabled={query.isFetchingNextPage || query.isRefetching} onClick={more}>
          {query.isFetchingNextPage ? <Spinner data-icon="inline-start" /> : null}
          더 보기
        </Button>
      </div> : null}
  </div>;
}
