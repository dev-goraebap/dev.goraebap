import { queryOptions } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

/** 로컬 날짜 "YYYY-MM-DD". */
export type DateKey = string;
export type EventColor = 'blue' | 'green' | 'orange' | 'purple';
/*
 * 색 이름 → 일정 막대 · 점의 색 변수: --event-fill(옅은 면)과 --event-ink(그 위 글자 · 점). 표시는 bg-(--event-fill) text-(--event-ink)로 칠한다.
 */
export const eventTone: Record<EventColor, string> = {
  blue: '[--event-fill:var(--event-blue)] [--event-ink:var(--event-blue-foreground)]',
  green: '[--event-fill:var(--event-green)] [--event-ink:var(--event-green-foreground)]',
  orange: '[--event-fill:var(--event-orange)] [--event-ink:var(--event-orange-foreground)]',
  purple: '[--event-fill:var(--event-purple)] [--event-ink:var(--event-purple-foreground)]',
};
export const colors: { id: EventColor; label: string }[] = [
  { id: 'blue', label: '파랑' }, { id: 'green', label: '초록' }, { id: 'orange', label: '주황' }, { id: 'purple', label: '보라' },
];

/** 하루 종일이면 time이 없다. 여러 날이면 start와 end(포함)가 다르다. */
export type CalendarEvent = { id: string; title: string; start: DateKey; end: DateKey; time?: string; place?: string; color: EventColor };
export type NewEvent = Omit<CalendarEvent, 'id'>;

/** 예제의 "오늘". 견본이 늘 같은 화면을 보이도록 고정한다. */
export const TODAY: DateKey = '2026-11-08';

export interface EventApi {
  list(signal?: AbortSignal): Promise<CalendarEvent[]>;
  create(input: NewEvent): Promise<CalendarEvent>;
  update(id: string, input: NewEvent): Promise<CalendarEvent>;
  remove(id: string): Promise<void>;
}

export const EventApiContext = createContext<EventApi | null>(null);
export function useEventApi() {
  const api = useContext(EventApiContext);
  if (!api) throw new Error('EventApiContext가 필요합니다.');
  return api;
}

export const eventKeys = { all: ['events'] as const };
export const eventQueries = {
  all: (api: EventApi) => queryOptions({ queryKey: eventKeys.all, queryFn: ({ signal }) => api.list(signal), staleTime: 30_000 }),
};

/* 날짜 계산: 모두 로컬 날짜 기준의 "YYYY-MM-DD" 문자열이라 문자열 비교가 곧 날짜 비교다. */
const pad = (value: number) => String(value).padStart(2, '0');
export const toKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` as DateKey;
export const fromKey = (key: string) => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
};
export const addDays = (key: DateKey, days: number) => {
  const date = fromKey(key);
  date.setDate(date.getDate() + days);
  return toKey(date);
};
/** 달을 옮기고, 도착한 달에 같은 날짜가 없으면 그 달의 마지막 날로 맞춘다. */
export const addMonths = (key: DateKey, months: number) => {
  const date = fromKey(key);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  date.setDate(Math.min(day, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()));
  return toKey(date);
};
export const startOfWeek = (key: DateKey) => addDays(key, -fromKey(key).getDay());
export const weekOf = (key: DateKey) => Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(key), index));
export const monthWeeks = (key: DateKey) => {
  const first = `${key.slice(0, 7)}-01` as DateKey;
  const last = toKey(new Date(fromKey(first).getFullYear(), fromKey(first).getMonth() + 1, 0));
  const weeks: DateKey[][] = [];
  for (let start = startOfWeek(first); start <= last; start = addDays(start, 7)) weeks.push(weekOf(start));
  return weeks;
};

export const weekdayNames = ['일', '월', '화', '수', '목', '금', '토'];
export const dayText = (key: DateKey) => `${fromKey(key).getMonth() + 1}월 ${fromKey(key).getDate()}일 (${weekdayNames[fromKey(key).getDay()]})`;
export const monthText = (key: DateKey) => `${fromKey(key).getFullYear()}년 ${fromKey(key).getMonth() + 1}월`;
export function weekText(key: DateKey) {
  const week = weekOf(key);
  const [first, last] = [fromKey(week[0]), fromKey(week[6])];
  const end = first.getMonth() === last.getMonth() ? `${last.getDate()}일` : `${last.getMonth() + 1}월 ${last.getDate()}일`;
  return `${first.getFullYear()}년 ${first.getMonth() + 1}월 ${first.getDate()}일 – ${end}`;
}
export const whenText = (event: CalendarEvent) => {
  const range = event.start === event.end ? dayText(event.start) : `${dayText(event.start)} – ${dayText(event.end)}`;
  return event.time ? `${range} ${event.time}` : `${range} · 종일`;
};

export const covers = (event: CalendarEvent, day: DateKey) => event.start <= day && day <= event.end;
/** 하루의 일정: 종일·여러 날을 앞에, 그 뒤는 시각 순. */
export const eventsOn = (events: CalendarEvent[], day: DateKey) => events.filter(each => covers(each, day))
  .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? '') || a.title.localeCompare(b.title, 'ko'));

export type Segment = { event: CalendarEvent; column: number; span: number; lane: number; continuesBefore: boolean; continuesAfter: boolean };

/**
 * 월 보기 한 주의 막대 배치. 여러 날 일정은 한 줄(lane)을 이어서 차지하고, maxLanes를 넘는 줄의 일정은 그릴 막대에서 빼고
 * 날짜별 숨은 개수(hidden)로 센다.
 */
export function layoutWeek(week: DateKey[], events: CalendarEvent[], maxLanes: number) {
  const columnOf = (event: CalendarEvent) => ({
    first: event.start < week[0] ? 0 : week.indexOf(event.start),
    last: event.end > week[6] ? 6 : week.indexOf(event.end),
  });
  const inWeek = events.filter(each => each.start <= week[6] && each.end >= week[0]).sort((a, b) => {
    const [x, y] = [columnOf(a), columnOf(b)];
    return x.first - y.first || (y.last - y.first) - (x.last - x.first) || (a.time ?? '').localeCompare(b.time ?? '');
  });
  const laneEnds: number[] = [];
  const segments: Segment[] = [];
  const hidden = week.map(() => 0);
  for (const event of inWeek) {
    const { first, last } = columnOf(event);
    let lane = laneEnds.findIndex(end => end < first);
    if (lane < 0) lane = laneEnds.length;
    laneEnds[lane] = last;
    if (lane >= maxLanes) { for (let column = first; column <= last; column += 1) hidden[column] += 1; continue; }
    segments.push({ event, column: first + 1, span: last - first + 1, lane, continuesBefore: event.start < week[0], continuesAfter: event.end > week[6] });
  }
  return { segments, hidden };
}
