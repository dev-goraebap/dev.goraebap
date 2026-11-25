import { useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { boardGroupsOptions } from '@/entities/work-item';
import type { BoardColumn, WorkItemListing, WorkItemRow, WorkItemViewGrouping } from '@/entities/work-item';
import { ApiError } from '@/shared/api';
import { Alert, AlertAction, AlertTitle } from '@goraebap/ui-react/compact/alert';
import { Button } from '@goraebap/ui-react/compact/button';
import { TriangleAlertIcon, XIcon } from '@/shared/ui/kit/icon';
import { ListMore } from '@/shared/ui/kit/list-more';
import { Page, type Crumb } from '@/shared/ui/kit/layout/page';
import { PageState } from '@/shared/ui/kit/page-state';
import { Spinner } from '@goraebap/ui-react/components/spinner';
import { ViewBar, ViewEditor, type ViewLayout } from '@/shared/ui/views';
import type { WorkItemViewsState } from '../model/use-work-item-views';
import { KanbanView, PagedKanbanView } from '../kanban-view';
import { ListView } from '../list-view';
import { PagedWorkItemGroups } from '../list-view/ui/PagedWorkItemGroups';
import { TableView } from '../table-view';
import { TimelineView } from '../timeline-view';

/**
 * A work item list's page, as BIT's and the playground's WorkItemsScreen compose it: the saved views in the toolbar (each laying
 * the work items out as a list, a table, a board or a timeline), 필터 and 표시 at its end with what is in force under it, and the
 * work items as the view lays them out; 더 보기 under a list that has more. The no-match state when the filters leave none, the
 * empty state when there is none at all. It draws what it is given; the page reads and keeps it (useWorkItemViews).
 * crumbs are the kit Page's (icons as components: pageCrumbs).
 */
export function WorkItemList({
  crumbs, pageActions, bar, tools, applied, create, notice, layout, grouping, workItems, columns, showsProject, showsBacklog, hrefOf, onCreateIn,
  board, isPending, error, isNarrowed, onClear, more, empty,
}: {
  crumbs: Crumb[];
  pageActions?: ReactNode;
  bar: WorkItemViewsState['bar'];
  tools: ReactNode;
  applied?: ReactNode;
  create?: { label: string; onClick?: () => void };
  /** A problem to say over the work items (a view the server refused to change), with its dismissal. */
  notice?: { message: string; onDismiss: () => void };
  board?: { projectKey?: string; listing: WorkItemListing };
  layout: ViewLayout;
  grouping: WorkItemViewGrouping;
  workItems: WorkItemRow[];
  columns?: readonly BoardColumn[];
  showsProject?: boolean;
  showsBacklog?: boolean;
  hrefOf?: (workItem: WorkItemRow) => string;
  /** Makes a work item in a status (a list grouped by status, a board's column); a project's lists only. */
  onCreateIn?: (columnId: string) => void;
  isPending?: boolean;
  error?: Error | null;
  isNarrowed: boolean;
  onClear: () => void;
  more?: { hasMore: boolean; isLoading: boolean; onMore: () => void };
  empty: { title: string; description: string };
}) {
  const [editing, setEditing] = useState<'new' | 'edit' | null>(null);
  const isGroupedList = layout === 'list' && grouping !== 'NONE' && !!board;
  const totals = useQuery({ ...boardGroupsOptions(board?.projectKey, board?.listing ?? {}, 'NONE'),
    enabled: !!board && layout !== 'kanban' && !isGroupedList });
  const total = totals.data?.reduce((sum, group) => sum + group.total, 0);
  const createAction = create ? <Button variant="create" onClick={create.onClick}>{create.label}</Button> : undefined;
  const body = () => {
    // 없거나 멤버가 아닌 프로젝트는 서버가 찾을 수 없다고 한다(프로젝트는 그 멤버에게만 보인다).
    if (error instanceof ApiError && error.status === 404) return <PageState kind="not-found" title="프로젝트를 찾을 수 없습니다"
      description="없는 프로젝트이거나 멤버가 아닌 프로젝트입니다. 필요하면 프로젝트 관리자에게 멤버로 넣어 달라고 요청하세요." />;
    if (error) return <PageState kind="error" title="업무를 불러오지 못했습니다" description={error.message} />;
    if (isPending) return <div className="flex justify-center p-6"><Spinner aria-label="업무를 불러오는 중" /></div>;
    if (layout === 'kanban' && board) return <PagedKanbanView {...board} grouping={grouping} columns={columns} showsProject={showsProject}
      showsBacklog={showsBacklog} isNarrowed={isNarrowed} hrefOf={hrefOf} onCreate={onCreateIn} />;
    if (isGroupedList && board) return <PagedWorkItemGroups {...board} grouping={grouping} columns={columns}
      showsProject={showsProject} hrefOf={hrefOf} onCreate={grouping === 'STATUS' ? onCreateIn : undefined}
      isNarrowed={isNarrowed} onClear={onClear} create={create} empty={empty} />;
    if (workItems.length === 0 && isNarrowed) return <PageState kind="search" title="조건에 맞는 업무가 없습니다"
      action={<Button variant="secondary" onClick={onClear}>조건 지우기</Button>} />;
    if (workItems.length === 0 && layout !== 'kanban') return <PageState kind="empty" title={empty.title} description={empty.description} action={createAction} />;
    if (layout === 'kanban') return <KanbanView grouping={grouping} isNarrowed={isNarrowed} workItems={workItems} columns={columns} showsProject={showsProject} showsBacklog={showsBacklog} hrefOf={hrefOf} onCreate={onCreateIn} />;
    if (layout === 'timeline') return <TimelineView workItems={workItems} hrefOf={hrefOf} showsProject={showsProject}
      more={{ hasMore: !!more?.hasMore, isLoading: !!more?.isLoading, onMore: () => more?.onMore() }} />;
    const rows = layout === 'table'
      ? <TableView workItems={workItems} showsProject={showsProject} hrefOf={hrefOf} />
      : <ListView workItems={workItems} grouping={grouping} columns={columns} showsProject={showsProject} hrefOf={hrefOf}
        onCreate={grouping === 'STATUS' ? onCreateIn : undefined} />;
    return <>
      {rows}
      <ListMore shown={workItems.length} total={total !== undefined && total >= workItems.length ? total : undefined} unit="건"
        hasMore={!!more?.hasMore} isLoading={!!more?.isLoading} onMore={() => more?.onMore()} />
    </>;
  };
  return <Page crumbs={crumbs} actions={pageActions} create={create ? { label: create.label, onClick: () => create.onClick?.() } : undefined} views={<ViewBar views={bar.views} value={bar.value} onChange={bar.onChange} actions={{
    onSaveNew: () => setEditing('new'), onEdit: bar.editDraft ? () => setEditing('edit') : undefined,
    order: bar.order, onDelete: bar.onDelete, deleteNote: '업무는 삭제하지 않습니다.',
  }} />} tools={tools} below={applied}>
    {notice ? <Alert className="mx-4 mt-3 w-auto shrink-0">
      <TriangleAlertIcon className="text-mark-high" />
      <AlertTitle className="whitespace-normal">{notice.message}</AlertTitle>
      <AlertAction>
        <Button variant="ghost" size="icon-sm" aria-label="닫기" onClick={notice.onDismiss}><XIcon /></Button>
      </AlertAction>
    </Alert> : null}
    {body()}
    {editing === 'new' ? <ViewEditor title="현재 조건을 새 뷰로 저장" initial={bar.newDraft()} onClose={() => setEditing(null)}
      onSave={draft => { bar.onCreate(draft); setEditing(null); }} /> : null}
    {editing === 'edit' && bar.editDraft ? <ViewEditor title="뷰 편집" initial={bar.editDraft} onClose={() => setEditing(null)}
      onSave={draft => { bar.onUpdate(draft); setEditing(null); }} /> : null}
  </Page>;
}
