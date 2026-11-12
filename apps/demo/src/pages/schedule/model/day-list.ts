import { byDayOrder, clock, covers, spanOf, type CalendarEvent } from "@/entities/event"

/** 하루 목록의 묶음(호호코워크 ScheduleDayPage · DayAgenda): 일정, 휴가. 휴가는 사람 수로 센다. */
export type DayGroup = { kind: "event" | "leave"; label: string; entries: CalendarEvent[] }

/**
 * 그날에 걸친 것을 묶음으로(막대 먼저, 그다음 시각 순). 이 앱의 휴가는 휴가 분류의 일정으로 들어와 있어 분류로 나눈다
 * (호호코워크는 휴가 원장에서 따로 읽는다). 휴가 일정 하나가 한 사람이다.
 */
export function dayGroups(day: string, events: readonly CalendarEvent[]): DayGroup[] {
  const on = events.filter(event => covers(event, day)).sort(byDayOrder)
  const leaves = on.filter(event => event.category === "leave")
  const others = on.filter(event => event.category !== "leave")
  return [
    ...(others.length > 0 ? [{ kind: "event" as const, label: `일정 ${others.length}`, entries: others }] : []),
    ...(leaves.length > 0 ? [{ kind: "leave" as const, label: `휴가 ${leaves.length}명`, entries: leaves }] : []),
  ]
}

/** 그날의 때(호호코워크 whenOn): 종일이거나 그날을 넘어 이어지면 종일, 아니면 시각. */
export function whenOn(event: CalendarEvent, day: string) {
  const { first, last } = spanOf(event)
  return event.isAllDay || first < day || last > day ? "종일" : `${clock(event.start)}–${clock(event.end)}`
}

/** 줄의 제목 아래: 그날의 때 · 곳. */
export const factsOn = (event: CalendarEvent, day: string) => [whenOn(event, day), event.location].filter(Boolean).join(" · ")

/** 주소의 날(2026-11-12)이 맞는 날인지. 틀린 주소는 없음으로 보인다. */
export function isDay(value: string) {
  const time = Date.parse(`${value}T00:00:00Z`)
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(time) && new Date(time).toISOString().startsWith(value)
}
