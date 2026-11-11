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

export const dayTone = (day: string) => weekdayTone(weekdayOf(day))

/** 월간 · 주간 격자의 일정 표시(막대 · 블록)가 가리킬 때 조금 진해지는 바탕. */
export const MARK_FILL = "bg-(--event-fill) text-(--event-ink) hover:bg-[color-mix(in_srgb,var(--event-fill)_80%,var(--foreground))]"
/** 키보드로 고른 일정 표시. */
export const MARK_FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-ring"
