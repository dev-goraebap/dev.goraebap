// 주는 그 주의 월요일(YYYY-MM-DD)로 부른다. 날짜는 모두 서울 시각으로 읽는다(호호코워크 weekly-report states).
const zone = { timeZone: "Asia/Seoul" } as const
const dayFormat = new Intl.DateTimeFormat("ko-KR", { ...zone, month: "long", day: "numeric" })
const weekdayFormat = new Intl.DateTimeFormat("ko-KR", { ...zone, month: "long", day: "numeric", weekday: "short" })
const momentFormat = new Intl.DateTimeFormat("ko-KR", { ...zone, month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })
const isoFormat = new Intl.DateTimeFormat("sv-SE", zone)

/** 날짜를 그날 정오로 읽어 서울 시각으로 포맷해도 하루가 밀리지 않게 한다. */
const noonOf = (date: string) => new Date(`${date}T12:00:00+09:00`)

/** 앞뒤로 며칠 옮긴 날. */
export function shiftDay(date: string, days: number): string {
  const day = noonOf(date)
  day.setUTCDate(day.getUTCDate() + days)
  return isoFormat.format(day)
}

/** 앞뒤로 몇 주 옮긴 월요일. */
export const shiftWeek = (weekStart: string, weeks: number) => shiftDay(weekStart, weeks * 7)

/** 날짜가 든 주의 월요일: 2026-11-12 → 2026-11-09. */
export function mondayOf(date: string): string {
  const day = noonOf(date)
  return shiftDay(date, -((day.getUTCDay() + 6) % 7))
}

/** 서울 기준 이번 주 월요일. */
export const thisMonday = (now: Date = new Date()) => mondayOf(isoFormat.format(now))

/** 주소에 든 값이 날짜(YYYY-MM-DD)인지. */
export const isDay = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)

/** 월요일부터 일요일까지: 11월 9일 ~ 11월 15일. */
export const weekText = (weekStart: string) => `${dayFormat.format(noonOf(weekStart))} ~ ${dayFormat.format(noonOf(shiftDay(weekStart, 6)))}`

/** 좁은 자리(휴대폰 툴바 · 앱 바)의 주: 11. 9. ~ 11. 15. */
export const weekShortText = (weekStart: string) => {
  const short = (date: string) => date.slice(5).split("-").map(Number).join(". ") + "."
  return `${short(weekStart)} ~ ${short(shiftDay(weekStart, 6))}`
}

/** 이번 주 · 지난주, 그 밖은 날짜. */
export function weekName(weekStart: string, now: Date = new Date()): string {
  const back = Math.round((noonOf(thisMonday(now)).getTime() - noonOf(weekStart).getTime()) / (7 * 86_400_000))
  return back === 0 ? "이번 주" : back === 1 ? "지난주" : weekText(weekStart)
}

/** 그 주의 마감: 금요일 18시. */
export const dueText = (weekStart: string) => `${weekdayFormat.format(noonOf(shiftDay(weekStart, 4)))} 18:00까지`

/** 제출 · 확인 시각: 11. 12. 09:30 */
export const momentText = (at: string) => momentFormat.format(new Date(at))
