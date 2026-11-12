import type { Display, DisplayChoice, SortKey } from '@/shared/ui/composites/filter/DisplayMenu';
import type { ListFilter } from '@/shared/ui/composites/filter/types';
import { NONE, people, priorities, priorityOf, statuses, type Issue } from '../../entities/issue';

/** 목록 주소의 검증. 표시·필터 값은 useAddressDisplay·useAddressFilters가 읽고, 여기서는 검색어와 열려 있는 패널만 검증한다. */
export type IssuesSearch = { q?: string; panel?: string };
export function validateIssuesSearch(raw: Record<string, unknown>): Record<string, unknown> & IssuesSearch {
  return {
    ...raw,
    q: typeof raw.q === 'string' && raw.q ? raw.q : undefined,
    panel: typeof raw.panel === 'string' && /^\/issues\/(new|ISS-\d+\/edit)$/.test(raw.panel) ? raw.panel : undefined,
  };
}

export const filters: ListFilter[] = [
  { key: 'status', label: '상태', icon: 'clock', isMultiple: true, options: statuses.map(each => ({ value: each.id, label: each.label })) },
  { key: 'assignee', label: '담당자', icon: 'user', isMultiple: true, options: [...people.map(name => ({ value: name, label: name })), { value: NONE, label: '지정 안 됨' }] },
  { key: 'priority', label: '우선순위', icon: 'alert', isMultiple: true, options: priorities.map(each => ({ value: each.id, label: each.label })) },
];

export const layouts: DisplayChoice[] = [
  { id: 'list', label: '리스트', icon: 'layout-list' },
  { id: 'board', label: '보드', icon: 'layout-board' },
];
export const sorts: SortKey[] = [
  { id: 'updated', label: '수정일', kind: 'date' },
  { id: 'due', label: '마감일', kind: 'date' },
  { id: 'priority', label: '우선순위', kind: 'rank' },
];
export const groups: DisplayChoice[] = [{ id: 'none', label: '없음' }, { id: 'status', label: '상태' }, { id: 'priority', label: '우선순위' }];
export const initialDisplay: Display = { layout: 'list', sort: 'updated', direction: 'desc', group: 'none' };

/** 마감이 없는 이슈는 방향과 관계없이 맨 뒤에 둔다. */
const compare = (sort: string) => (a: Issue, b: Issue): number => {
  if (sort === 'priority') return priorityOf(a.priority).rank - priorityOf(b.priority).rank;
  if (sort === 'due') return (a.due ?? '').localeCompare(b.due ?? '');
  return a.updatedAt.localeCompare(b.updatedAt);
};

/** 조회 결과에 조건을 적용한다. 큰 목록은 서버가 거른다. */
export function visibleIssues(items: Issue[], q: string | undefined, state: Record<string, string[]>, display: Display) {
  const needle = q?.trim().toLowerCase();
  const kept = items.filter(item => (!needle || `${item.id} ${item.title}`.toLowerCase().includes(needle))
    && (!state.status?.length || state.status.includes(item.status))
    && (!state.priority?.length || state.priority.includes(item.priority))
    && (!state.assignee?.length || state.assignee.includes(item.assignee ?? NONE)));
  const withDue = display.sort === 'due' ? kept.filter(item => item.due) : kept;
  const withoutDue = display.sort === 'due' ? kept.filter(item => !item.due) : [];
  const sorted = [...withDue].sort(compare(display.sort));
  return [...(display.direction === 'desc' ? sorted.reverse() : sorted), ...withoutDue];
}
