/** How 시스템 현황 writes sizes, times, requests and browsers. */

export function bytesText(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value >= 100 ? Math.round(value) : value.toFixed(1)}${units[unit]}`;
}

/** 12ms, 1.4초. */
export const durationText = (ms: number) => (ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(ms < 10_000 ? 1 : 0)}초`);

/** 3일 4시간, 5시간 12분, 8분. */
export function uptimeText(seconds: number): string {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}일 ${hours}시간`;
  if (hours > 0) return `${hours}시간 ${minutes}분`;
  return `${minutes}분`;
}

export const percentText = (ratio?: number | null) => (ratio == null ? '-' : `${Math.round(ratio * 100)}%`);
export const countText = (count: number) => count.toLocaleString('ko-KR');

const moment = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit',
});
export const momentText = (iso?: string | null) => (iso ? moment.format(new Date(iso)) : '-');

const hourLabel = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', hour: 'numeric', hourCycle: 'h23' });
const dayLabel = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' });
/** A bucket's label on a chart's axis: the hour (14시) for a day, the date (10. 6) for a week or a month. */
export const bucketLabel = (iso: string, hourly: boolean) =>
  (hourly ? hourLabel.format(new Date(iso)) : dayLabel.format(new Date(iso)).replace(/\.$/, ''));

/** What part of cowork an API path belongs to, by its first segment after /api/v1/. */
const AREAS: Record<string, string> = {
  auth: '로그인', me: '내 정보', employees: '사원', departments: '조직', positions: '직급', titles: '직위', directory: '조직도',
  leave: '휴가', approval: '결재', approvals: '결재', overtime: '연장근무', 'work-schedule': '출퇴근 시간', calendar: '일정',
  events: '일정', meetings: '회의록', tags: '태그', announcements: '공지', notifications: '알림', push: '푸시 알림',
  'push-deliveries': '알림 발송 현황', files: '파일', holidays: '공휴일', settings: '설정', system: '시스템 현황',
  realtime: '실시간', projects: '프로젝트', documents: '문서', 'document-folders': '문서', 'manual-chapters': '매뉴얼',
  'weekly-reports': '주간보고', admin: '관리', search: '검색', feedback: '개선의견',
};
export function areaOf(route: string): string {
  const segment = route.replace(/^\/api\/v1\//, '').split('/')[0] ?? '';
  return AREAS[segment] ?? (route.startsWith('/api/') ? '기타' : route);
}

/** The path without its /api/v1 front, which every one shares. */
export const shortRoute = (route: string) => route.replace(/^\/api\/v1/, '');

export type OutcomeTone = { label: string; color: 'green' | 'orange' | 'red' | 'gray' };
/** How a request ended: done, refused (a member's mistake or no right), or a server failure. */
export function outcomeOf(status: number): OutcomeTone {
  if (status >= 500) return { label: `서버 오류 ${status}`, color: 'red' };
  if (status >= 400) return { label: `거절됨 ${status}`, color: 'orange' };
  return { label: '성공', color: 'green' };
}

/** A browser and system read from the User-Agent, such as Chrome · macOS; null when neither is known. */
export function agentText(agent?: string | null): string | null {
  if (!agent) return null;
  const browser = /Edg\//.test(agent) ? 'Edge' : /Whale\//.test(agent) ? 'Whale' : /SamsungBrowser\//.test(agent) ? '삼성 인터넷'
    : /Firefox\//.test(agent) ? 'Firefox' : /Chrome\//.test(agent) ? 'Chrome' : /Safari\//.test(agent) ? 'Safari' : null;
  const system = /iPhone|iPad/.test(agent) ? 'iOS' : /Android/.test(agent) ? 'Android' : /Mac OS X|Macintosh/.test(agent) ? 'macOS'
    : /Windows/.test(agent) ? 'Windows' : /Linux/.test(agent) ? 'Linux' : null;
  const parts = [browser, system].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
}

type ActivityLike = { kind: 'CHANGE' | 'VISIT'; route: string; method?: string | null; status?: number | null; visits?: number | null; lastAt?: string | null };

/**
 * What an activity was, as a title and the line under it: a change by the part of cowork it touched over its method
 * and path, a visit by the screen (its address) over how many times and until when it was opened again.
 */
export function activityText(row: ActivityLike): { title: string; detail: string } {
  if (row.kind === 'VISIT') {
    const times = row.visits ?? 1;
    return { title: `${row.route} 화면 열람`, detail: times > 1 ? `${times}회 · ${momentText(row.lastAt)}까지` : '1회' };
  }
  return { title: areaOf(row.route), detail: `${row.method ?? ''} ${shortRoute(row.route)}`.trim() };
}

/** How an activity ended: a change's outcome, or 열람 for a screen opened. */
export const activityOutcome = (row: ActivityLike): OutcomeTone =>
  (row.kind === 'VISIT' || row.status == null ? { label: '열람', color: 'gray' } : outcomeOf(row.status));

const seoulDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });

/** The records' spans of days (they are kept 30 days): today, the last 7, the last 30. */
export const DAY_SPANS = [{ value: 'today', label: '오늘' }, { value: 'week', label: '최근 7일' }, { value: 'month', label: '최근 30일' }];

/** A span's first and last day in Seoul, YYYY-MM-DD. */
export function spanRange(span?: string): { from?: string; to?: string } {
  const days = span === 'today' ? 0 : span === 'week' ? 6 : span === 'month' ? 29 : undefined;
  if (days === undefined) return {};
  const now = Date.now();
  return { from: seoulDay.format(new Date(now - days * 86_400_000)), to: seoulDay.format(new Date(now)) };
}
