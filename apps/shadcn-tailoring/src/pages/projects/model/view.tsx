import { PROJECT_PEOPLE, type Project } from "@/entities/project"
import type { FilterDef, FilterState } from "@/shared/ui/filter"
import { PersonAvatar } from "@/shared/ui/person-avatar"
import { StarIcon, UserIcon } from "@/shared/ui/icon"

/** 뷰: 진행 중(목록) · 보드(상태 칸) · 보관함(목록). */
export type View = "active" | "board" | "archived"

export type FilterKey = "starred" | "lead"

/** 프로젝트 필터(호호코워크 즐겨찾기 필터에 리드를 더함). */
export const FILTERS: FilterDef<FilterKey>[] = [
  { key: "starred", label: "즐겨찾기", icon: StarIcon, options: [{ value: "yes", label: "즐겨찾기만", icon: <StarIcon className="text-icon-muted" /> }] },
  { key: "lead", label: "리드", icon: UserIcon,
    options: PROJECT_PEOPLE.map(person => ({ value: person.id, label: person.name, icon: <PersonAvatar id={person.id} name={person.name} className="size-4" /> })) },
]

export function applyFilters(projects: Project[], state: FilterState<FilterKey>) {
  return projects.filter(project => (!state.starred?.length || project.starred)
    && (!state.lead?.length || state.lead.includes(project.lead.id)))
}

/* 표시: 정렬 기준과 방향. 사용자 지정은 관리자가 정한 순서다. */
export type SortKey = "custom" | "name" | "progress" | "members"
export type Display = { sort: SortKey; direction: "asc" | "desc" }
export const INITIAL_DISPLAY: Display = { sort: "custom", direction: "asc" }

export const SORTS: { value: SortKey; label: string; kind: "rank" | "text" }[] = [
  { value: "custom", label: "사용자 지정", kind: "rank" }, { value: "name", label: "이름", kind: "text" },
  { value: "progress", label: "진행률", kind: "rank" }, { value: "members", label: "멤버 수", kind: "rank" },
]
export const DIRECTIONS = { rank: ["앞 → 뒤", "뒤 → 앞"], text: ["가 → 하", "하 → 가"] } as const

const compare: Record<SortKey, (a: Project, b: Project) => number> = {
  custom: (a, b) => a.position - b.position,
  name: (a, b) => a.name.localeCompare(b.name, "ko"),
  progress: (a, b) => a.progress - b.progress,
  members: (a, b) => a.memberCount - b.memberCount,
}

export function sortProjects(projects: Project[], display: Display) {
  const sorted = [...projects].sort(compare[display.sort])
  return display.direction === "desc" ? sorted.reverse() : sorted
}
