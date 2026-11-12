import type { FilterDef, FilterState } from '@/shared/ui/filter';
import { ChartNoAxesColumnIcon, SquareCheckIcon, UserIcon } from '@/shared/ui/icon';
import { NONE, people, priorities, priorityOf, statuses, type Issue } from '../../entities/issue';

/** 목록 주소의 검증. 표시 · 필터 값은 useAddressChoices · useAddressFilters가 읽고, 여기서는 검색어와 열려 있는 패널만 검증한다. */
export type IssuesSearch = { q?: string; panel?: string };
export function validateIssuesSearch(raw: Record<string, unknown>): Record<string, unknown> & IssuesSearch {
  return {
    ...raw,
    q: typeof raw.q === 'string' && raw.q ? raw.q : undefined,
    panel: typeof raw.panel === 'string' && /^\/issues\/(new|ISS-\d+\/edit)$/.test(raw.panel) ? raw.panel : undefined,
  };
}

export type FilterKey = 'status' | 'assignee' | 'priority';
export const filterKeys: FilterKey[] = ['status', 'assignee', 'priority'];
export const filters: FilterDef<FilterKey>[] = [
  { key: 'status', label: '상태', icon: SquareCheckIcon, options: statuses.map(each => ({ value: each.id, label: each.label })) },
  { key: 'assignee', label: '담당자', icon: UserIcon, options: [...people.map(name => ({ value: name, label: name })), { value: NONE, label: '지정 안 됨' }] },
  { key: 'priority', label: '우선순위', icon: ChartNoAxesColumnIcon, options: priorities.map(each => ({ value: each.id, label: each.label })) },
];

/** 표시: 보기(리스트 · 보드) · 정렬 · 방향 · 그룹. 모두 주소가 가지고, 처음 값은 주소에서 뺀다. */
export type Display = { layout: 'list' | 'board'; sort: 'updated' | 'due' | 'priority'; direction: 'desc' | 'asc'; group: 'none' | 'status' | 'priority' };
export const initialDisplay: Display = { layout: 'list', sort: 'updated', direction: 'desc', group: 'none' };
export const layouts = [{ value: 'list', label: '리스트' }, { value: 'board', label: '보드' }] as const;
export const sorts = [{ value: 'updated', label: '수정일', kind: 'date' }, { value: 'due', label: '마감일', kind: 'date' }, { value: 'priority', label: '우선순위', kind: 'rank' }] as const;
/** 방향은 정렬 기준에 맞는 말로 쓴다(날짜는 최신 · 오래된, 순위는 높은 · 낮은). */
export const directions = { date: ['최신 → 오래된', '오래된 → 최신'], rank: ['높은 → 낮은', '낮은 → 높은'] } as const;
export const groups = [{ value: 'none', label: '없음' }, { value: 'status', label: '상태' }, { value: 'priority', label: '우선순위' }] as const;
export const displayChoices = {
  layout: layouts.map(each => each.value), sort: sorts.map(each => each.value), direction: ['desc', 'asc'] as const, group: groups.map(each => each.value),
};

/** 마감이 없는 이슈는 방향과 관계없이 맨 뒤에 둔다. */
const compare = (sort: Display['sort']) => (a: Issue, b: Issue): number => {
  if (sort === 'priority') return priorityOf(a.priority).rank - priorityOf(b.priority).rank;
  if (sort === 'due') return (a.due ?? '').localeCompare(b.due ?? '');
  return a.updatedAt.localeCompare(b.updatedAt);
};

/** 조회 결과에 조건을 적용한다. 큰 목록은 서버가 거른다. */
export function visibleIssues(items: Issue[], q: string | undefined, state: FilterState<FilterKey>, display: Display) {
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
