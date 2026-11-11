import { AUTHORS, CATEGORIES, type Announcement } from "@/entities/announcement"
import type { FilterDef, FilterState } from "@/shared/ui/filter"
import { BellIcon, CalendarIcon, PaperclipIcon, TagIcon, UserIcon } from "@/shared/ui/icon"
import { PersonAvatar } from "@/shared/ui/person-avatar"

export type FilterKey = "read" | "category" | "period" | "author" | "attached"

/** 공지 필터(호호코워크 AnnouncementsPage): 읽음 · 분류 · 게시일 · 작성자 · 첨부. 분류는 이 앱의 공지에만 있다. */
export const FILTERS: FilterDef<FilterKey>[] = [
  { key: "read", label: "읽음", icon: BellIcon, options: [{ value: "unread", label: "안 읽음" }, { value: "read", label: "읽음" }] },
  { key: "category", label: "분류", icon: TagIcon, options: CATEGORIES.map(category => ({ value: category.value, label: category.label })) },
  { key: "period", label: "게시일", icon: CalendarIcon,
    options: [{ value: "week", label: "최근 7일" }, { value: "month", label: "최근 30일" }, { value: "year", label: "최근 1년" }] },
  { key: "author", label: "작성자", icon: UserIcon, isSearchable: true,
    options: AUTHORS.map(person => ({ value: person.id, label: person.name, icon: <PersonAvatar id={person.id} name={person.name} className="size-4" /> })) },
  { key: "attached", label: "첨부", icon: PaperclipIcon, options: [{ value: "yes", label: "있음" }, { value: "no", label: "없음" }] },
]

const DAYS = { week: 7, month: 30, year: 365 } as const
const isWithin = (iso: string, period: string) => Date.now() - new Date(iso).getTime() <= DAYS[period as keyof typeof DAYS] * 86_400_000

/** 찾는 말(제목)과 필터가 통과시키는 공지(서버가 하듯). 한 필터 안에서는 고른 값 중 하나면 된다. */
export function applyFilters(items: Announcement[], state: FilterState<FilterKey>, query: string) {
  const words = query.trim().toLowerCase()
  const any = (key: FilterKey, test: (value: string) => boolean) => !state[key]?.length || state[key].some(test)
  return items.filter(item => (!words || item.title.toLowerCase().includes(words))
    && any("read", value => (value === "read") === item.isRead)
    && any("category", value => value === item.category)
    && any("period", value => isWithin(item.publishedAt, value))
    && any("author", value => value === item.author.id)
    && any("attached", value => (value === "yes") === item.attachments.length > 0))
}

/* 표시: 게시일 · 제목 순과 방향. 처음은 게시일 최신 순이다. */
export type SortKey = "published" | "title"
export type Display = { sort: SortKey; direction: "desc" | "asc" }
export const INITIAL_DISPLAY: Display = { sort: "published", direction: "desc" }
export const SORTS: { value: SortKey; label: string }[] = [{ value: "published", label: "게시일" }, { value: "title", label: "제목" }]
export const DIRECTIONS = {
  published: [{ value: "desc", label: "최신 → 오래된" }, { value: "asc", label: "오래된 → 최신" }],
  title: [{ value: "asc", label: "가 → 하" }, { value: "desc", label: "하 → 가" }],
} as const

const compare: Record<SortKey, (a: Announcement, b: Announcement) => number> = {
  published: (a, b) => a.publishedAt.localeCompare(b.publishedAt),
  title: (a, b) => a.title.localeCompare(b.title, "ko"),
}

/**
 * 정렬한 공지. 찾는 말이 없으면 고정 공지가 맨 앞에 한 번 서고(자기 자리에는 다시 나오지 않는다), 나머지가 표시 순서를 따른다.
 */
export function orderItems(items: Announcement[], display: Display, isSearching: boolean) {
  const sorted = [...items].sort(compare[display.sort])
  if (display.direction === "desc") sorted.reverse()
  if (isSearching) return sorted
  return [...sorted.filter(item => item.isPinned), ...sorted.filter(item => !item.isPinned)]
}
