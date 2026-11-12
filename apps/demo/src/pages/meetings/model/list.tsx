import { PROGRESS, PROJECTS, progressOf, type Meeting } from "@/entities/meeting"
import type { FilterDef, FilterState } from "@/shared/ui/filter"
import { ClockIcon, ProjectsIcon } from "@/shared/ui/icon"

export type FilterKey = "project" | "progress"

/** 회의록 필터(호호코워크 MeetingsPage): 프로젝트 · 상태(만드는 중 · 완료 · 실패). */
export const FILTERS: FilterDef<FilterKey>[] = [
  { key: "project", label: "프로젝트", icon: ProjectsIcon, options: PROJECTS.map(project => ({ value: project, label: project, icon: <ProjectsIcon /> })) },
  { key: "progress", label: "상태", icon: ClockIcon, options: PROGRESS.map(each => ({ value: each.value, label: each.label })) },
]

/** 찾는 말이 걸리는 글: 제목 · 요약 · 안건 · 결정 사항 · 할 일 · 참고 메모 · 받아쓴 원문. */
const textOf = (meeting: Meeting) => [
  meeting.title, meeting.summary, meeting.note ?? "", ...meeting.agenda, ...meeting.decisions,
  ...meeting.actionItems.map(item => item.text), ...meeting.transcript.map(line => line.text),
].join("\n").toLowerCase()

/** 찾는 말과 필터가 통과시키는 회의록(서버가 하듯). 한 필터 안에서는 고른 값 중 하나면 된다. */
export function applyFilters(items: Meeting[], state: FilterState<FilterKey>, query: string) {
  const words = query.trim().toLowerCase()
  const any = (key: FilterKey, value: string | undefined) => !state[key]?.length || (value !== undefined && state[key].includes(value))
  return items.filter(item => (!words || textOf(item).includes(words)) && any("project", item.project) && any("progress", progressOf(item.status)))
}

/* 표시: 회의 일시의 방향. 처음은 최근 회의가 위다. */
export type Direction = "desc" | "asc"
export const DIRECTIONS: { value: Direction; label: string }[] = [{ value: "desc", label: "최신 → 오래된" }, { value: "asc", label: "오래된 → 최신" }]

export function orderItems(items: Meeting[], direction: Direction) {
  const sorted = [...items].sort((a, b) => a.heldStart.localeCompare(b.heldStart))
  return direction === "desc" ? sorted.reverse() : sorted
}
