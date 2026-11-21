const seoulDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });

/** The day a moment (2026-11-02T05:10:00Z) falls on in Seoul, or a date (2026-11-02) as it is. */
export function dayOf(value: string): string {
  return value.length > 10 ? seoulDay.format(new Date(value)) : value;
}

/** A work item's date or moment as its rows read it: 11월 2일, with the year only when it is not this one. */
export function formatWorkItemDate(value: string, today = new Date()): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dayOf(value));
  if (!match) return value;
  const [, year, month, day] = match;
  const date = `${Number(month)}월 ${Number(day)}일`;
  return Number(year) === Number(seoulDay.format(today).slice(0, 4)) ? date : `${year}년 ${date}`;
}

/** Whether an open work item's due date has passed. */
export const isLate = (dueDate: string | undefined, isClosed: boolean, today = new Date()) =>
  !!dueDate && !isClosed && dueDate < seoulDay.format(today);

