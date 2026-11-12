import { cn } from "cn"
import { eventCategory } from "../model/categories"
import type { EventCategory, EventColor } from "../model/types"

/*
 * 분류 색을 두 변수로 건넨다: --event-fill(막대 · 블록 바탕)과 --event-ink(그 위 글자 · 점).
 * 표시는 bg-(--event-fill) text-(--event-ink)처럼 칠하고, 가리킴 같은 상태는 표시 쪽에서 이 변수를 섞어 만든다.
 */
const TONES: Record<EventColor, string> = {
  blue: "[--event-fill:var(--event-blue)] [--event-ink:var(--event-blue-foreground)]",
  green: "[--event-fill:var(--event-green)] [--event-ink:var(--event-green-foreground)]",
  orange: "[--event-fill:var(--event-orange)] [--event-ink:var(--event-orange-foreground)]",
  purple: "[--event-fill:var(--event-purple)] [--event-ink:var(--event-purple-foreground)]",
  red: "[--event-fill:var(--event-red)] [--event-ink:var(--event-red-foreground)]",
  teal: "[--event-fill:var(--event-teal)] [--event-ink:var(--event-teal-foreground)]",
  pink: "[--event-fill:var(--event-pink)] [--event-ink:var(--event-pink-foreground)]",
  yellow: "[--event-fill:var(--event-yellow)] [--event-ink:var(--event-yellow-foreground)]",
  gray: "[--event-fill:var(--event-gray)] [--event-ink:var(--event-gray-foreground)]",
}

/** 그 분류의 색 변수(--event-fill · --event-ink)를 거는 클래스. */
export const eventTone = (category: EventCategory) => TONES[eventCategory(category).color]

/** 분류 색의 작은 점(7px). 옆에 이름이 있으므로 읽지 않는다. */
export function EventDot({ category, className }: { category: EventCategory; className?: string }) {
  return <span aria-hidden className={cn(eventTone(category), "size-[0.4375rem] shrink-0 rounded-full bg-(--event-ink)", className)} />
}
