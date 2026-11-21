import { useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { columnsOptions, cyclesOptions, newWorkItemHref, workItemHref, labelsOptions, useWorkItemTypes, workingPeopleOptions } from '@/entities/work-item';
import { projectOptions } from '@/entities/project';
import { useOpenPanel } from '@/shared/lib/panel';
import { pageCrumbs } from '@/shared/ui/nav-icon';
import { groupingOf, groupsOf, isNarrowed, WorkItemList, projectFilters, queryOf, sortsOf, useWorkItemTools, useWorkItemViews, ViewTweaks } from '@/features/work-item-list';

/** The router's crumbs (icons by meaning name), handed to the kit Page through pageCrumbs. */
type Crumb = { label: string; href?: string; icon?: string };

/**
 * A project's 업무 (client/'s project list page, BIT's project work items) under its saved views: a view lays the work items
 * out as a list grouped as it chooses, a table, or the board of the project's columns, narrowed by status, assignee (나
 * among them), label, type and priority and ordered as it keeps (a board in board order). Any member adds work items (새
 * 업무, or + on a status) while the project is not archived. The project's key is the address's ($key).
 */
export function ProjectWorkItemsPage({ crumbs }: { crumbs: Crumb[] }) {
  const { key = '' } = useParams({ strict: false }) as { key?: string };
  // Another project's list starts over: its own views, filters and work items.
  return <ProjectWorkItems key={key.toUpperCase()} projectKey={key} crumbs={crumbs} />;
}

function ProjectWorkItems({ projectKey: key, crumbs }: { projectKey: string; crumbs: Crumb[] }) {
  const openPanel = useOpenPanel();
  const state = useWorkItemViews(key);
  const project = useQuery(projectOptions(key));
  const columns = useQuery(columnsOptions(key));
  const labels = useQuery(labelsOptions());
  const { types } = useWorkItemTypes();
  const people = useQuery(workingPeopleOptions());
  const cycles = useQuery(cyclesOptions(key));
  const list = projectFilters({ columns: columns.data, labels: labels.data, types, people: people.data, cycles: cycles.data?.cycles });
  const { tools, applied } = useWorkItemTools({
    layout: { value: state.layout, onChange: state.setLayout },
    filters: state.filters, list, sorts: sortsOf(true), groups: groupsOf(true), initial: queryOf(state.view).display,
    trailing: state.isChanged ? <ViewTweaks isChanged canSave={state.canSave} isSaving={state.isSaving} onRevert={state.revert} onSave={state.save} /> : undefined,
  });
  // 업무를 만들고 옮기는 것은 에디터 이상(보관 · 삭제한 프로젝트는 아무도, 서버의 can.edit).
  const canWrite = !!project.data?.can.edit;
  const workItems = state.workItems;
  const items = workItems.data?.pages.flatMap(page => page.items) ?? [];
  const newHref = newWorkItemHref(key);
  const create = canWrite ? { label: '새 업무', onClick: () => openPanel(newHref) } : undefined;
  return <WorkItemList board={state.board} crumbs={pageCrumbs(crumbs)} bar={state.bar} tools={tools} applied={applied} create={create}
    notice={state.problem ? { message: state.problem, onDismiss: state.dismiss } : undefined}
    showsBacklog={columns.data?.some(column => column.category === 'BACKLOG' && state.query.state.status?.includes(column.id))} layout={state.layout} grouping={groupingOf(state.filters.display)} workItems={items} columns={columns.data} hrefOf={workItemHref}
    onCreateIn={canWrite ? columnId => openPanel(`${newHref}?column=${columnId}`) : undefined}
    isPending={(!state.isGroupPaged && workItems.isPending) || state.list.isPending || project.isPending || columns.isPending}
    error={project.error ?? columns.error ?? (state.isGroupPaged ? null : workItems.error) ?? state.list.error}
    isNarrowed={isNarrowed(state.query)} onClear={state.filters.clear}
    more={{ hasMore: !!workItems.hasNextPage && !workItems.isPlaceholderData, isLoading: workItems.isFetchingNextPage, onMore: () => void workItems.fetchNextPage() }}
    empty={canWrite
      ? { title: '아직 업무가 없습니다', description: '새 업무로 이 프로젝트의 할 일이나 버그를 남겨 보세요.' }
      : { title: '아직 업무가 없습니다', description: '보관한 프로젝트라 업무를 더할 수 없습니다.' }} />;
}
