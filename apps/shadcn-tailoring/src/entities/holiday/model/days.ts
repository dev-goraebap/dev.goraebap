import type { Holiday } from "./types"

/** 날짜 → 공휴일 이름. 달력이 날마다 이름을 찾는다. */
export const holidayNames = (holidays: readonly Holiday[]): ReadonlyMap<string, string> =>
  new Map(holidays.map(holiday => [holiday.date, holiday.name]))

/** 공휴일 날짜의 모음. 휴가 일수를 셀 때 주말과 함께 빼는 날이다. */
export const closedDays = (holidays: readonly Holiday[]): ReadonlySet<string> => new Set(holidays.map(holiday => holiday.date))

/** 그 달(2026-10)의 공휴일. 달력 아래 안내 한 줄이 쓴다. */
export const holidaysInMonth = (holidays: readonly Holiday[], month: string) =>
  holidays.filter(holiday => holiday.date.startsWith(month.slice(0, 7)))
