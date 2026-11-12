/** 일정 분류. 분류마다 색이 하나다(EVENT_CATEGORIES). */
export type EventCategory = "meeting" | "external" | "leave" | "event" | "deadline" | "inspection" | "education" | "review" | "etc"

/** 분류의 색. 토큰 이름(--event-blue …)과 같다. */
export type EventColor = "blue" | "green" | "orange" | "purple" | "red" | "teal" | "pink" | "yellow" | "gray"

/**
 * 일정. 시각 일정은 분 단위(2026-11-03T10:30)로 시작과 끝을, 종일 일정은 첫날과 마지막 날(2026-11-12, 2026-11-14, 마지막 날 포함)을 둔다.
 * 시간대 없이 적힌 그대로 읽는다.
 */
export type CalendarEvent = {
  id: string
  title: string
  start: string
  end: string
  isAllDay?: boolean
  category: EventCategory
  location?: string
}

export type NewCalendarEvent = Omit<CalendarEvent, "id">
