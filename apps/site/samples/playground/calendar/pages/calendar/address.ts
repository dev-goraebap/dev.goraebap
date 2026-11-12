import { useLocation, useNavigate } from '@tanstack/react-router';
import { TODAY, type DateKey } from '../../entities/event';

export type CalendarView = 'month' | 'week';
export type CalendarAddress = { view: CalendarView; date: DateKey; event?: string };

/** 주소의 검색 값을 읽는다. 알 수 없는 값은 기본(월 보기, 오늘)으로 돌린다. */
export function validateCalendarSearch(search: Record<string, unknown>): CalendarAddress {
  const date = typeof search.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(search.date) ? search.date as DateKey : TODAY;
  return { view: search.view === 'week' ? 'week' : 'month', date, event: typeof search.event === 'string' ? search.event : undefined };
}

/** 기본값은 주소에 쓰지 않는다. */
export function calendarHref({ view, date, event }: CalendarAddress) {
  const query = new URLSearchParams();
  if (view !== 'month') query.set('view', view);
  if (date !== TODAY) query.set('date', date);
  if (event) query.set('event', event);
  const text = query.toString();
  return text ? `/calendar?${text}` : '/calendar';
}

/** 보기·기준 날짜·열린 일정은 모두 주소가 가진다. 새로고침하거나 주소를 건네도 같은 화면이 열린다. */
export function useCalendarAddress() {
  const address = validateCalendarSearch(useLocation().search as Record<string, unknown>);
  const navigate = useNavigate();
  const go = (next: Partial<CalendarAddress>, options?: { replace?: boolean }) =>
    void navigate({ href: calendarHref({ ...address, event: undefined, ...next }), replace: options?.replace });
  return { ...address, go };
}
