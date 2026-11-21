/**
 * 표·정보 묶음에 쓰는 짧은 시각 표기: 회사 시계(서울)로 yyyy-mm-dd HH:mm. 길이가 늘 같고(고정폭 숫자) 짧아 좁은 열에서도
 * 잘리지 않는다. 날짜만 있는 값(yyyy-mm-dd)은 그대로 둔다.
 */
const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const pick = (date: Date) => Object.fromEntries(parts.formatToParts(date).map(part => [part.type, part.value]));

/** 2026-11-09 14:05 */
export function stampText(value?: string | Date | null): string {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const p = pick(date);
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

