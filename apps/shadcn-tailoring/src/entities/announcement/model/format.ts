import type { AnnouncementCategory } from "./types"

export const CATEGORIES: readonly { value: AnnouncementCategory; label: string }[] = [
  { value: "general", label: "일반" },
  { value: "hr", label: "인사" },
  { value: "welfare", label: "복지" },
  { value: "system", label: "시스템" },
  { value: "event", label: "행사" },
]

export const categoryLabel = (category: AnnouncementCategory) => CATEGORIES.find(each => each.value === category)?.label ?? category

const zone = { timeZone: "Asia/Seoul" } as const
const moment = new Intl.DateTimeFormat("ko-KR", { ...zone, year: "numeric", month: "long", day: "numeric", weekday: "short", hour: "numeric", minute: "2-digit" })
const thisYear = new Intl.DateTimeFormat("ko-KR", { ...zone, month: "long", day: "numeric" })
const pastYear = new Intl.DateTimeFormat("ko-KR", { ...zone, year: "numeric", month: "numeric", day: "numeric" })
const yearOf = (date: Date) => new Intl.DateTimeFormat("en", { ...zone, year: "numeric" }).format(date)

/** 상세의 때: 날짜 · 요일 · 시각(2026년 11월 10일 (화) 오전 9:30). */
export const momentText = (iso: string) => moment.format(new Date(iso))

/** 목록의 날짜: 올해면 월 · 일, 지난해면 연도까지(호호코워크 listDateText). */
export function listDateText(iso: string) {
  const date = new Date(iso)
  return (yearOf(date) === yearOf(new Date()) ? thisYear : pastYear).format(date)
}

/** 파일 크기: 1.2 MB, 340 KB. */
export function sizeText(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}
