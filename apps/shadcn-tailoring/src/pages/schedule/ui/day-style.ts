import { weekdayOf } from "@/entities/event"

/** 오늘 칸의 옅은 빗금(호호코워크 월간). */
export const TODAY_HATCH =
  "bg-[repeating-linear-gradient(135deg,color-mix(in_srgb,var(--event-blue-foreground)_19%,transparent)_0_1px,transparent_1px_6px)]"

/** 요일의 글자색: 일요일은 휴일색, 토요일은 파랑. 평일은 물려받는다. */
export function weekdayTone(weekday: number) {
  if (weekday === 0) return "text-day-off"
  if (weekday === 6) return "text-saturday"
  return undefined
}

/** 공휴일 이름(날짜 → 이름). 일정 화면이 공휴일 엔터티에서 만들어 격자마다 넘긴다. */
export type HolidayNames = ReadonlyMap<string, string>

/** 날의 글자색(호호코워크 data-off · data-saturday): 공휴일은 요일과 상관없이 휴일색, 아니면 요일의 색. */
export const dayTone = (day: string, holidays?: HolidayNames) => (holidays?.has(day) ? "text-day-off" : weekdayTone(weekdayOf(day)))

/** 날의 읽는 이름 뒤에 붙는 공휴일: "11월 3일 화요일 개천절". */
export const holidaySuffix = (day: string, holidays?: HolidayNames) => (holidays?.has(day) ? ` ${holidays.get(day)}` : "")

/** 월간 · 주간 격자의 일정 표시(막대 · 블록)가 가리킬 때 조금 진해지는 바탕. */
export const MARK_FILL = "bg-(--event-fill) text-(--event-ink) hover:bg-[color-mix(in_srgb,var(--event-fill)_80%,var(--foreground))]"
/** 키보드로 고른 일정 표시. */
export const MARK_FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-ring"
