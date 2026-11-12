import type { EventCategory, EventColor } from "./types"

export type EventCategoryMeta = { value: EventCategory; label: string; color: EventColor }

/** 일정 분류와 그 색. 새 일정의 분류 고르기도 이 순서를 따른다. */
export const EVENT_CATEGORIES: EventCategoryMeta[] = [
  { value: "meeting", label: "회의", color: "blue" },
  { value: "external", label: "외부 미팅", color: "pink" },
  { value: "event", label: "행사", color: "purple" },
  { value: "education", label: "교육", color: "green" },
  { value: "review", label: "리뷰", color: "yellow" },
  { value: "inspection", label: "점검", color: "teal" },
  { value: "deadline", label: "마감", color: "red" },
  { value: "leave", label: "휴가", color: "orange" },
  { value: "etc", label: "기타", color: "gray" },
]

export const eventCategory = (value: EventCategory) => EVENT_CATEGORIES.find(category => category.value === value) ?? EVENT_CATEGORIES[EVENT_CATEGORIES.length - 1]
