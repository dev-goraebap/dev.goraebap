import type { components } from '@/shared/api';
import { DEFAULT_MARK_COLOR } from '@/shared/ui/color-palette';

/*
 * The saved views over a work item list (BIT's views, D-066 · D-068 · D-088 · D-106) as pills over it. A scope (the
 * workspace's list across projects, or one project's) has the built-in 전체 업무, which nobody stores, its shared views
 * and the member's own personal ones, in the scope's order; the first is its default. A view keeps its filters (several
 * values of one joined by commas), order, grouping and layout.
 */

type Schemas = components['schemas'];
export type WorkItemViewLayout = Schemas['ViewInput']['layout'];
export type WorkItemViewSort = Schemas['ViewInput']['sort'];
export type WorkItemViewDirection = Schemas['ViewInput']['direction'];
export type WorkItemViewGrouping = Schemas['ViewInput']['grouping'];
export type WorkItemViewFilters = Partial<Record<WorkItemViewFilterKey, string>>;
export type WorkItemListView = {
  id: string; name: string; icon: string; color: string; layout: WorkItemViewLayout; filters: WorkItemViewFilters; sort: WorkItemViewSort;
  direction: WorkItemViewDirection; grouping: WorkItemViewGrouping; isPersonal: boolean; canEdit: boolean; version?: number; isBuiltIn?: boolean;
};
/** What a view is made or changed with (the server's ViewInput). */
export type WorkItemViewInput = Pick<WorkItemListView, 'name' | 'icon' | 'color' | 'layout' | 'filters' | 'sort' | 'direction' | 'grouping' | 'isPersonal'>;
/** A scope's views as the server answers: every key in the pills' order, the views, and whether the reader keeps the shared ones. */
export type WorkItemViewList = { order: string[]; views: WorkItemListView[]; canOrder: boolean };

export const ALL_VIEW = 'all';
export const MY_WORK_VIEW = 'mine';
export const VIEW_FILTER_KEYS = ['project', 'status', 'assignee', 'label', 'type', 'priority', 'cycle'] as const;
export type WorkItemViewFilterKey = (typeof VIEW_FILTER_KEYS)[number];

/** The groupings a view takes, as the server names them; 프로젝트 only across the workspace. */
export const VIEW_GROUPINGS: readonly { value: WorkItemViewGrouping; label: string }[] = [
  { value: 'STATUS', label: '상태' }, { value: 'ASSIGNEE', label: '담당자' }, { value: 'PRIORITY', label: '우선순위' },
  { value: 'TYPE', label: '유형' }, { value: 'PROJECT', label: '프로젝트' }, { value: 'NONE', label: '없음' },
];
/** The orders a list takes: a project's board order, or by the moment a work item changed or was made. */
export const VIEW_SORTS: readonly { value: WorkItemViewSort; label: string; kind: 'rank' | 'date' }[] = [
  { value: 'BOARD', label: '보드 순서', kind: 'rank' }, { value: 'UPDATED', label: '수정일', kind: 'date' }, { value: 'CREATED', label: '만든 날', kind: 'date' },
];

/**
 * 전체 업무, the view every scope has and nobody stores: every work item by status, a project's in board order. Its mark colour
 * is none of its own; a view made from it takes a stored view's (markColorOf).
 */
export function everyWorkItemView(isProject: boolean): WorkItemListView {
  return {
    id: ALL_VIEW, name: '전체', icon: 'layout-list', color: '', layout: 'LIST', filters: {},
    sort: isProject ? 'BOARD' : 'UPDATED', direction: isProject ? 'ASC' : 'DESC', grouping: 'STATUS', isPersonal: false, canEdit: false, isBuiltIn: true,
  };
}

const clean = (filters: WorkItemViewFilters | undefined): WorkItemViewFilters =>
  Object.fromEntries(Object.entries(filters ?? {}).filter(([, value]) => !!value)) as WorkItemViewFilters;

/**
 * The scope's views in the pills' order, 전체 업무 among them; a view the order misses follows (the server lists every one).
 * Across the workspace 내 업무 (nobody stores it) comes first and is the default: 업무's first page is one's own work
 * (2026-11-13). A project's default is 전체.
 */
export function viewsInOrder(list: WorkItemViewList | undefined, isProject: boolean): WorkItemListView[] {
  const all = everyWorkItemView(isProject);
  const pinned: WorkItemListView[] = isProject ? [] : [{ ...all, id: MY_WORK_VIEW, name: '내 업무', icon: 'user', filters: { assignee: 'me' } }];
  const byId = new Map<string, WorkItemListView>([[ALL_VIEW, all], ...(list?.views ?? []).map(view => [view.id, { ...view, filters: clean(view.filters) }] as const)]);
  const ordered = (list?.order ?? []).flatMap(key => byId.get(key) ?? []);
  const listed = [...ordered, ...[...byId.values()].filter(view => !ordered.includes(view))];
  return [...pinned, ...listed];
}

/**
 * The mark colour a view is saved with when none was picked in the view editor (the server wants one): the colour of the
 * view it is made from, or of the scope's first stored view, or the palette's default.
 */
export const markColorOf = (from: WorkItemListView, views: readonly WorkItemListView[]) =>
  from.color || views.find(view => !view.isBuiltIn && view.color)?.color || DEFAULT_MARK_COLOR;
