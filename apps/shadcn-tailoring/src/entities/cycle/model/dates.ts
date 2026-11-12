import type { Cycle, CycleState } from "./types"

/** 날짜만 다루므로 YYYY-MM-DD 문자열을 그대로 비교한다(시간대로 하루 밀리지 않게 로컬 자정으로 읽는다). */
const toDate = (day: string) => new Date(`${day}T00:00:00`)
const pad = (value: number) => String(value).padStart(2, "0")
export const isoDay = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
export const today = () => isoDay(new Date())

export function addDays(day: string, days: number) {
  const date = toDate(day)
  date.setDate(date.getDate() + days)
  return isoDay(date)
}

/** 시작 요일(1 월 … 7 일) 기준으로 오늘이 속한 주의 첫날. */
export function weekStartOf(day: string, startDay: number) {
  const weekday = toDate(day).getDay() || 7
  return addDays(day, -((weekday - startDay + 7) % 7))
}

export function cycleState(cycle: Pick<Cycle, "startDate" | "endDate" | "completedAt">, on = today()): CycleState {
  if (cycle.completedAt) return "completed"
  if (cycle.endDate < on) return "ended"
  if (cycle.startDate <= on) return "current"
  return "upcoming"
}

export const CYCLE_STATES: Record<CycleState, string> = { upcoming: "예정", current: "진행 중", ended: "기간 끝남", completed: "마침" }

const short = new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" })
const long = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" })
const withWeekday = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short" })

/** 레일의 날짜: 11월 9일 */
export const shortDay = (day: string) => short.format(toDate(day))
/** 요일까지: 11월 23일 (월) */
export const dayWithWeekday = (day: string) => withWeekday.format(toDate(day))
/** 사이클의 기간: 11월 9일 – 11월 22일 */
export const cycleDays = (cycle: Pick<Cycle, "startDate" | "endDate">) => `${long.format(toDate(cycle.startDate))} – ${long.format(toDate(cycle.endDate))}`
