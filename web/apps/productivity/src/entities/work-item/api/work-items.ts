import { infiniteQueryOptions, keepPreviousData, queryOptions, type QueryClient } from '@tanstack/react-query';
import { getJson, sendCommand, sendCreate, type components } from '@/shared/api';
import type { WorkItemViewGrouping } from '../model/views';
import type { BoardColumn, WorkItemDraft, WorkItemLabel, WorkItemTypeRow, WorkItemPerson, WorkItemRow, WorkItemSlice, WorkItemView, TimelineEntry } from '../model/types';

/*
 * Work items' reads and writes against /api/v1/workspace/projects/{key}/issues and the workspace's /api/v1/workspace/issues, as client/'s. Every
 * read sits under ['workItems'], so a change made here reads them all again. A project's key in a path is its current key or
 * an old one.
 */

/**
 * What a list asks the server for, as its query reads it: several values of one filter joined by commas. status is a
 * project's column ids (columnId) or, across the workspace, the categories (category); assignee holds member ids, me and
 * none.
 */
export type WorkItemListing = {
  project?: string; columnId?: string; category?: string; assignee?: string; labelId?: string; type?: string; priority?: string; cycle?: string;
  q?: string; sort?: 'BOARD' | 'UPDATED' | 'CREATED'; direction?: 'ASC' | 'DESC';
};

/** How many work items a slice holds: a list's, and the board's, which wants every card of a project at once. */
export const PAGE_SIZE = 50;
export const BOARD_SIZE = 200;

const at = (key: string) => `/api/v1/workspace/projects/${encodeURIComponent(key)}`;
export const workItemPath = (key: string, number: number) => `${at(key)}/issues/${number}`;

export const workItemKeys = {
  all: ['workItems'] as const,
  list: (scope: string, listing: WorkItemListing, size: number) => ['workItems', 'list', scope, listing, size] as const,
  workItem: (key: string, number: number) => ['workItems', 'workItem', key.toUpperCase(), number] as const,
  timeline: (key: string, number: number) => ['workItems', 'timeline', key.toUpperCase(), number] as const,
  columns: (key: string) => ['workItems', 'columns', key.toUpperCase()] as const,
  labels: ['workItems', 'labels'] as const,
  types: ['workItems', 'types'] as const,
};

/** Whatever changed in work items: every work item read is read again. */
export const refreshWorkItems = (client: QueryClient) => client.invalidateQueries({ queryKey: workItemKeys.all });

/**
 * Work items a slice at a time: a project's (key) or the workspace's across every live project (no key). Every condition goes
 * into the key, so other conditions start the list over; the slice before stays on screen meanwhile.
 */
export const workItemsOptions = (key: string | undefined, listing: WorkItemListing, size = PAGE_SIZE) => infiniteQueryOptions({
  queryKey: workItemKeys.list(key?.toUpperCase() ?? '*', listing, size),
  queryFn: ({ pageParam, signal }) => {
    const params = new URLSearchParams({ size: String(size) });
    for (const [name, value] of Object.entries(listing)) if (value) params.set(name, value);
    if (pageParam) params.set('cursor', pageParam);
    return getJson<WorkItemSlice>(`${key ? `${at(key)}/issues` : '/api/v1/workspace/issues'}?${params}`, signal);
  },
  initialPageParam: undefined as string | undefined,
  getNextPageParam: last => last.nextCursor ?? undefined,
  placeholderData: keepPreviousData,
});

/** One work item by its project's key and number; a missing one fails as not found. */
export const workItemOptions = (key: string, number: number) => queryOptions({
  queryKey: workItemKeys.workItem(key, number),
  queryFn: ({ signal }) => getJson<WorkItemView>(workItemPath(key, number), signal),
});

/** What happened to a work item and its discussion, oldest first. */
export const timelineOptions = (key: string, number: number) => queryOptions({
  queryKey: workItemKeys.timeline(key, number),
  queryFn: ({ signal }) => getJson<TimelineEntry[]>(`${workItemPath(key, number)}/timeline`, signal),
});

/** A project's board columns, the statuses its work items move through, in the board's order. */
export const columnsOptions = (key?: string) => queryOptions({
  queryKey: workItemKeys.columns(key ?? "*"),
  queryFn: ({ signal }) => getJson<BoardColumn[]>(key ? `${at(key)}/columns` : "/api/v1/workspace/issue-columns", signal),
  staleTime: 60_000,
});

/** The workspace's labels, every project's alike (결정기록 2026-11-04 프로젝트 관리), in their order. */
export const labelsOptions = () => queryOptions({
  queryKey: workItemKeys.labels,
  queryFn: ({ signal }) => getJson<WorkItemLabel[]>('/api/v1/workspace/work-item-labels', signal),
  staleTime: 60_000,
});

/** The workspace's work item types (작업 · 버그 · 기능 · 에픽 and those an administrator adds), in their order. */
export const typesOptions = () => queryOptions({
  queryKey: workItemKeys.types,
  queryFn: ({ signal }) => getJson<WorkItemTypeRow[]>('/api/v1/workspace/work-item-types', signal),
  staleTime: 5 * 60_000,
});

/**
 * The working members, to give a work item to or filter by, by name (the org chart's people; client/ reads them from
 * entities/organization, which web/ does not have yet).
 */
export const workingPeopleOptions = () => queryOptions({
  queryKey: ['departments', 'org-chart'],
  queryFn: ({ signal }) => getJson<{ people?: Partial<WorkItemPerson>[] }>('/api/v1/directory/org-chart', signal),
  select: chart => (chart.people ?? []).filter((person): person is WorkItemPerson => !!person.id && !!person.name)
    .sort((one, other) => one.name.localeCompare(other.name, 'ko')),
  staleTime: 5 * 60_000,
});

const body = (draft: WorkItemDraft) => ({
  title: draft.title.trim(), type: draft.type, priority: draft.priority, columnId: draft.columnId, assigneeId: draft.assigneeId,
  startDate: draft.startDate, dueDate: draft.dueDate, parentId: draft.parentId, labelIds: draft.labelIds,
  estimateHours: draft.estimateHours, storyPoints: draft.storyPoints, cycleId: draft.cycleId,
});

/** A new work item in the project; its key and number come back. */
export async function createWorkItem(key: string, draft: WorkItemDraft): Promise<{ key: string; number: number }> {
  const location = await sendCreate(`${at(key)}/issues`, body(draft));
  return { key, number: Number(location.split('/').pop()) };
}

/** Every property as the work item now has them, to change one and send them all. */
export const draftOf = (workItem: WorkItemRow): WorkItemDraft & { columnId: string } => ({
  title: workItem.title, type: workItem.type, priority: workItem.priority, columnId: workItem.columnId, assigneeId: workItem.assigneeId,
  startDate: workItem.startDate, dueDate: workItem.dueDate, parentId: workItem.parentId, labelIds: workItem.labels.map(label => label.id),
  estimateHours: workItem.estimateHours ?? undefined, storyPoints: workItem.storyPoints ?? undefined, cycleId: workItem.cycleId ?? undefined,
});

/** Every property at once, over the version the work item was read at (409 when another change came first). */
export const editWorkItem = (workItem: WorkItemRow, draft: WorkItemDraft & { columnId: string }) =>
  sendCommand(workItemPath(workItem.projectKey, workItem.number), 'PATCH', { expectedVersion: workItem.version, ...body(draft) });

export const deleteWorkItem = (workItem: WorkItemRow) =>
  sendCommand(`${workItemPath(workItem.projectKey, workItem.number)}?expectedVersion=${workItem.version}`, 'DELETE');

/** A comment written (quoting words of the body it was written on), changed or deleted in a work item's discussion. */
export function changeComment(key: string, number: number, change: { commentId?: string; text?: string; quote?: string; parentId?: string; blockId?: string; isDeleting?: boolean }): Promise<void> {
  const base = `${workItemPath(key, number)}/comments`;
  if (change.isDeleting && change.commentId) return sendCommand(`${base}/${change.commentId}`, 'DELETE');
  if (change.commentId) return sendCommand(`${base}/${change.commentId}`, 'PATCH', { body: change.text });
  return sendCreate(base, { body: change.text, quote: change.quote, parentId: change.parentId, blockId: change.blockId }).then(() => undefined);
}

/** A thread on a work item's 활동 resolved, or opened again. */
export function resolveComment(key: string, number: number, commentId: string, resolved: boolean): Promise<void> {
  return sendCommand(`${workItemPath(key, number)}/comments/${commentId}/resolution`, 'PUT', { resolved });
}

/** 카드 조회와 같은 조건으로 계산한 칼럼별 전체 건수. */
export type WorkItemBoardGroup = Omit<Required<components['schemas']['IssueGroup']>, 'category'> & { category?: BoardColumn['category'] };
export const boardGroupsOptions = (key: string | undefined, listing: WorkItemListing, grouping: WorkItemViewGrouping) => queryOptions({
  queryKey: [...workItemKeys.all, 'board-groups', key?.toUpperCase() ?? '*', listing, grouping],
  queryFn: ({ signal }) => {
    const params = new URLSearchParams({ grouping });
    for (const [name, value] of Object.entries(listing)) if (value) params.set(name, value);
    return getJson<WorkItemBoardGroup[]>(`${key ? `${at(key)}/issues` : '/api/v1/workspace/issues'}/groups?${params}`, signal);
  },
});
