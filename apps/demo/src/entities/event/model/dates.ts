import type { CalendarEvent } from "./types"

/*
 * 날은 2026-11-03, 시각은 2026-11-03T10:30 문자열로 다룬다. 날 수 계산은 UTC 자정으로 해서 서머타임에 하루가 빠지지 않는다.
 * 주는 일요일에 시작한다(호호코워크 팀 캘린더와 같음).
 */
const MS_DAY = 86_400_000
const toUtc = (day: string) => Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)))
const fromUtc = (time: number) => new Date(time).toISOString().slice(0, 10)
const pad = (value: number) => String(value).padStart(2, "0")

const monthTitleFormat = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", timeZone: "UTC" })
const weekdayFormat = new Intl.DateTimeFormat("ko-KR", { weekday: "narrow", timeZone: "UTC" })
const dayTitleFormat = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "long", timeZone: "UTC" })
const monthDayFormat = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", timeZone: "UTC" })

/** 일요일부터 요일 이름(일 · 월 … 토). 2023-01-01이 일요일이다. */
export const WEEKDAYS = Array.from({ length: 7 }, (_, index) => weekdayFormat.format(new Date(toUtc("2023-01-01") + index * MS_DAY)))

export const dayOf = (moment: string) => moment.slice(0, 10)
export const shiftDay = (day: string, days: number) => fromUtc(toUtc(day) + days * MS_DAY)
export const daysBetween = (from: string, to: string) => Math.round((toUtc(to) - toUtc(from)) / MS_DAY)
/** 0(일요일) … 6(토요일). */
export const weekdayOf = (day: string) => new Date(toUtc(day)).getUTCDay()
export const isSameMonth = (a: string, b: string) => a.slice(0, 7) === b.slice(0, 7)
export const dayNumber = (day: string) => Number(day.slice(8, 10))

/** 같은 날짜의 몇 달 뒤(앞). 그 달에 없는 날(31일)은 그 달 마지막 날로. */
export function shiftMonth(day: string, months: number): string {
  const date = new Date(toUtc(day))
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1))
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
  return fromUtc(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), Math.min(date.getUTCDate(), last)))
}

/** 그 날이 든 주의 일곱 날, 일요일부터. */
export const weekDays = (day: string) => Array.from({ length: 7 }, (_, index) => shiftDay(day, index - weekdayOf(day)))

/** 그 날이 든 달의 여섯 주. 앞뒤 달의 날로 주를 채운다. */
export function monthWeeks(day: string): string[][] {
  const first = weekDays(`${day.slice(0, 8)}01`)[0]
  return Array.from({ length: 6 }, (_, week) => Array.from({ length: 7 }, (_, index) => shiftDay(first, week * 7 + index)))
}

/** 자정부터 분(10:30이면 630). */
export const minuteOf = (moment: string) => Number(moment.slice(11, 13)) * 60 + Number(moment.slice(14, 16))
/** 10:30 */
export const clock = (moment: string) => moment.slice(11, 16)
/** 정각은 10시, 아니면 10:30(호호코워크 월간 칸의 시각). */
export const shortClock = (moment: string) => (moment.slice(14, 16) === "00" ? `${Number(moment.slice(11, 13))}시` : clock(moment))
/** 2026년 11월 */
export const monthTitle = (day: string) => monthTitleFormat.format(new Date(toUtc(day)))
/** 11월 3일 */
export const monthDay = (day: string) => monthDayFormat.format(new Date(toUtc(day)))
/** 11월 3일 화요일 */
export const dayTitle = (day: string) => dayTitleFormat.format(new Date(toUtc(day)))

/** 이 화면 시계의 오늘(2026-11-03)과 지금(2026-11-03T10:30). */
export function currentDay(now = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}
export function currentMoment(now = new Date()): string {
  return `${currentDay(now)}T${pad(now.getHours())}:${pad(now.getMinutes())}`
}

/** 일정이 걸친 첫날과 마지막 날. */
export const spanOf = (event: CalendarEvent) => ({ first: dayOf(event.start), last: dayOf(event.end) })
/** 종일이거나 하루를 넘는 일정: 시각 줄이 아니라 날을 가로지르는 막대로 그린다. */
export const isBar = (event: CalendarEvent) => Boolean(event.isAllDay) || dayOf(event.start) !== dayOf(event.end)
export const covers = (event: CalendarEvent, day: string) => spanOf(event).first <= day && day <= spanOf(event).last

/** 10:30–11:30, 종일 일정은 종일. */
export const timeRange = (event: CalendarEvent) => (event.isAllDay ? "종일" : `${clock(event.start)}–${clock(event.end)}`)

/** 11월 3일 화요일 · 10:30–11:30, 여러 날이면 11월 11일 – 11월 13일 · 종일. */
export function eventWhen(event: CalendarEvent): string {
  const { first, last } = spanOf(event)
  const days = first === last ? dayTitle(first) : `${monthDay(first)} – ${monthDay(last)}`
  return `${days} · ${timeRange(event)}`
}

/** 하루 안의 일정 순서: 막대가 먼저, 그다음 시작 시각. */
export const byDayOrder = (a: CalendarEvent, b: CalendarEvent) => Number(isBar(b)) - Number(isBar(a)) || a.start.localeCompare(b.start)
