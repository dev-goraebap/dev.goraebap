import { paths } from "@/shared/config"

/** 일정 하나의 페이지(호호코워크 eventHref). */
export const eventHref = (id: string) => `${paths.schedule}/events/${encodeURIComponent(id)}`

/** 하루의 페이지(호호코워크 dayHref): 그날의 일정 · 휴가 목록. */
export const dayHref = (day: string) => `${paths.schedule}/days/${day}`
