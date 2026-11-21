const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });
const clock = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', hour: 'numeric', minute: '2-digit' });
const monthDay = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric' });
const fullDay = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric' });

/** The day in Seoul a moment falls on, as 2026-10-03. */
const seoulDay = (at: Date | number) => dayKey.format(at);

/**
 * When a notice came, told on its own row: the time today (오후 3:12), 어제 and the time, the month, day and time this
 * year (10월 1일 오후 3:12), and the whole date for another year (2025년 10월 1일).
 */
export function momentOf(at: string, now: number): string {
  const date = new Date(at);
  const day = seoulDay(date);
  const today = seoulDay(now);
  if (day === today) return clock.format(date);
  if (day === seoulDay(now - 86_400_000)) return `어제 ${clock.format(date)}`;
  if (day.slice(0, 4) === today.slice(0, 4)) return `${monthDay.format(date)} ${clock.format(date)}`;
  return fullDay.format(date);
}
