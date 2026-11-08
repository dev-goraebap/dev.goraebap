import type { ListFilter } from '@/shared/ui/composites/filter/types';
import { infiniteQueryOptions, keepPreviousData } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

/** 활동: 누가·무엇을·언제. 읽기만 하는 기록이라 고치거나 지우는 동작이 없다. */
export type ActivityKind = 'create' | 'edit' | 'comment' | 'approve' | 'delete';
export type Activity = { id: string; actor: string; kind: ActivityKind; target: string; at: string };

/** 모의 시계. 상대 시각과 날짜 구분의 "오늘"이 실행한 날과 무관하게 같게 나오도록 고정한다. */
export const NOW = '2026-11-08T11:00:00Z';

export const actors = ['서윤', '지우', '도현', '민준', '하은'];
export const kinds: Record<ActivityKind, { label: string; verb: string }> = {
  create: { label: '생성', verb: '문서를 만들었습니다' },
  edit: { label: '수정', verb: '문서를 수정했습니다' },
  comment: { label: '댓글', verb: '문서에 댓글을 남겼습니다' },
  approve: { label: '승인', verb: '문서를 승인했습니다' },
  delete: { label: '삭제', verb: '문서를 삭제했습니다' },
};
export const periods = [{ value: 'today', label: '오늘' }, { value: 'week', label: '최근 7일' }, { value: 'month', label: '최근 30일' }];

/** 조건: 기간은 하나, 사람과 종류는 여럿(같은 속성 안은 OR, 속성끼리는 AND). 비어 있으면 거르지 않는다. */
export type Conditions = { period?: string; actors: string[]; kinds: string[] };

export const filters: ListFilter[] = [
  { key: 'period', label: '기간', icon: 'calendar', options: periods },
  { key: 'actor', label: '사람', icon: 'user', isMultiple: true, options: actors.map(name => ({ value: name, label: name })) },
  { key: 'type', label: '종류', icon: 'tag', isMultiple: true, options: Object.entries(kinds).map(([value, each]) => ({ value, label: each.label })) },
];

/** 주소에 적힌 값 중 선택지에 있는 것만 조건으로 쓴다. */
export function conditionsOf(state: Record<string, string[]>): Conditions {
  const allowed = (key: string) => (state[key] ?? []).filter(value => filters.find(filter => filter.key === key)?.options.some(option => option.value === value));
  return { period: allowed('period')[0], actors: allowed('actor'), kinds: allowed('type') };
}

export const PAGE = 10;
export type ActivityPage = { items: Activity[]; total: number };
export interface ActivityApi {
  list(conditions: Conditions, offset: number, signal?: AbortSignal): Promise<ActivityPage>;
}
export const ActivityApiContext = createContext<ActivityApi | null>(null);
export function useActivityApi() {
  const api = useContext(ActivityApiContext);
  if (!api) throw new Error('ActivityApiContext가 필요합니다.');
  return api;
}

/** 조건을 키에 모두 넣는다. 조건을 바꾸는 동안은 이전 결과를 남겨 두고 진행 중임을 알린다. */
export const activityQueries = {
  list: (api: ActivityApi, conditions: Conditions) => infiniteQueryOptions({
    queryKey: ['activity', conditions] as const,
    queryFn: ({ pageParam, signal }) => api.list(conditions, pageParam, signal),
    initialPageParam: 0,
    getNextPageParam: (last, all) => { const shown = all.reduce((sum, page) => sum + page.items.length, 0); return shown < last.total ? shown : undefined; },
    placeholderData: keepPreviousData, staleTime: 30_000,
  }),
};

const dayKey = (value: string) => value.slice(0, 10);
const dayFormat = new Intl.DateTimeFormat('ko', { month: 'long', day: 'numeric', weekday: 'long', timeZone: 'UTC' });
/** 날짜 구분의 이름: 오늘·어제, 그 밖은 날짜와 요일. */
export function dayLabel(key: string) {
  const diff = (Date.parse(dayKey(NOW)) - Date.parse(key)) / 86_400_000;
  return diff === 0 ? '오늘' : diff === 1 ? '어제' : dayFormat.format(new Date(key));
}

/** 가까운 때는 상대 시각으로, 정확한 시각은 툴팁이 말한다. */
export function relativeText(at: string) {
  const minutes = Math.max(0, Math.floor((Date.parse(NOW) - Date.parse(at)) / 60_000));
  if (minutes < 1) return '방금';
  if (minutes < 60) return `${minutes}분 전`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}시간 전`;
  return `${Math.floor(minutes / 60 / 24)}일 전`;
}
export const exactText = (at: string) => `${new Intl.DateTimeFormat('ko', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(new Date(at))}`;

export type Day = { key: string; label: string; items: Activity[] };
export function groupByDay(items: Activity[]): Day[] {
  const days: Day[] = [];
  for (const item of items) {
    const key = dayKey(item.at);
    const last = days[days.length - 1];
    if (last?.key === key) last.items.push(item); else days.push({ key, label: dayLabel(key), items: [item] });
  }
  return days;
}
