import type { ReactNode } from "react"
import type { FilterDef, FilterState } from "@/shared/ui/filter"
import {
  LABELS, ME, PEOPLE, PRIORITIES, TYPES, PersonAvatar, WorkItemLabelDot, WorkItemPriorityIcon, WorkflowColumnIcon,
  columnOf, type WorkflowColumn, type WorkItem, type WorkItemPriority,
} from "@/entities/work-item"
import { ChartNoAxesColumnIcon, ListChecksIcon, SquareCheckIcon, TagIcon, UserIcon } from "@/shared/ui/icon"

export type FilterKey = "status" | "assignee" | "label" | "type" | "priority"

const typeIcon = <ListChecksIcon className="text-icon-muted" />

/** 칸(상태)마다 한 줄: 프로젝트 워크플로의 순서와 이름, 분류의 아이콘. */
const columnOptions = (columns: readonly WorkflowColumn[]) =>
  columns.map(column => ({ value: column.id, label: column.name, icon: <WorkflowColumnIcon column={column} /> }))

/** 업무가 놓인 칸 id. 지워진 칸의 업무는 대체 칸에 있는 것으로 거르고 묶는다(보드와 같이). */
export const columnIdOf = (columns: readonly WorkflowColumn[], item: WorkItem) => columnOf(columns, item.status).id

/** 이 프로젝트의 필터(호호코워크 projectFilters): 상태(프로젝트의 칸) · 담당자 · 라벨 · 유형 · 우선순위. */
export const filtersOf = (columns: readonly WorkflowColumn[]): FilterDef<FilterKey>[] => [
  { key: "status", label: "상태", icon: SquareCheckIcon, options: columnOptions(columns) },
  { key: "assignee", label: "담당자", icon: UserIcon, isSearchable: true, options: [
    { value: "me", label: "나", icon: <UserIcon className="text-icon-muted" /> },
    { value: "none", label: "담당자 없음", icon: <UserIcon className="text-icon-muted" /> },
    ...PEOPLE.map(person => ({ value: person.id, label: person.name, icon: <PersonAvatar person={person} className="size-4" /> })),
  ] },
  { key: "label", label: "라벨", icon: TagIcon, isSearchable: true,
    options: LABELS.map(label => ({ value: label.id, label: label.name, icon: <WorkItemLabelDot color={label.color} /> })) },
  { key: "type", label: "유형", icon: ListChecksIcon, options: TYPES.map(type => ({ value: type.value, label: type.label, icon: typeIcon })) },
  { key: "priority", label: "우선순위", icon: ChartNoAxesColumnIcon,
    options: PRIORITIES.map(priority => ({ value: priority.value, label: priority.label, icon: <WorkItemPriorityIcon priority={priority.value} /> })) },
]

/** 필터가 통과시키는 업무(서버가 하듯). 담당자의 "나"는 ME다. */
export function applyFilters(items: WorkItem[], state: FilterState<FilterKey>, columns: readonly WorkflowColumn[]) {
  const any = (key: FilterKey, value: string) => !state[key]?.length || state[key].includes(value)
  const person = (item: WorkItem) => !state.assignee?.length || state.assignee.some(value =>
    value === "none" ? !item.assignee : value === "me" ? item.assignee?.id === ME.id : value === item.assignee?.id)
  return items.filter(item => any("status", columnIdOf(columns, item)) && any("priority", item.priority) && any("type", item.type) && person(item)
    && (!state.label?.length || item.labels.some(label => state.label!.includes(label.id))))
}

/* 표시: 정렬 기준 · 방향 · 그룹. */
export type SortKey = "updated" | "created" | "priority" | "due"
export type GroupKey = "status" | "assignee" | "priority" | "type" | "none"
export type Display = { sort: SortKey; direction: "desc" | "asc"; group: GroupKey }

export const INITIAL_DISPLAY: Display = { sort: "updated", direction: "desc", group: "status" }

export const SORTS: { value: SortKey; label: string; kind: "date" | "rank" }[] = [
  { value: "updated", label: "수정일", kind: "date" }, { value: "created", label: "만든 날", kind: "date" },
  { value: "priority", label: "우선순위", kind: "rank" }, { value: "due", label: "마감일", kind: "date" },
]
export const DIRECTIONS = { date: ["최신 → 오래된", "오래된 → 최신"], rank: ["높은 → 낮은", "낮은 → 높은"] } as const
export const GROUPS: { value: GroupKey; label: string }[] = [
  { value: "status", label: "상태" }, { value: "assignee", label: "담당자" }, { value: "priority", label: "우선순위" },
  { value: "type", label: "유형" }, { value: "none", label: "없음" },
]

const rank = (priority: WorkItemPriority) => PRIORITIES.find(each => each.value === priority)!.level
const compare: Record<SortKey, (a: WorkItem, b: WorkItem) => number> = {
  updated: (a, b) => a.updatedAt.localeCompare(b.updatedAt),
  created: (a, b) => a.number - b.number,
  priority: (a, b) => rank(a.priority) - rank(b.priority),
  due: (a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""),
}

export function sortItems(items: WorkItem[], display: Display) {
  const sorted = [...items].sort(compare[display.sort])
  return display.direction === "desc" ? sorted.reverse() : sorted
}

export type WorkItemGroup = { id: string; label: string; icon?: ReactNode; items: WorkItem[] }

/** 표시의 그룹대로 나눈다. 비어 있는 그룹은 뺀다. 상태 묶음은 프로젝트의 칸 순서다. */
export function groupItems(items: WorkItem[], group: GroupKey, columns: readonly WorkflowColumn[]): WorkItemGroup[] {
  const by = (list: Omit<WorkItemGroup, "items">[], idOf: (item: WorkItem) => string) =>
    list.map(each => ({ ...each, items: items.filter(item => idOf(item) === each.id) })).filter(each => each.items.length > 0)
  switch (group) {
    case "status":
      return by(columnOptions(columns).map(({ value, label, icon }) => ({ id: value, label, icon })), item => columnIdOf(columns, item))
    case "priority":
      return by(PRIORITIES.map(priority => ({ id: priority.value, label: priority.value === "none" ? "우선순위 없음" : priority.label,
        icon: <WorkItemPriorityIcon priority={priority.value} /> })), item => item.priority)
    case "type":
      return by(TYPES.map(type => ({ id: type.value, label: type.label, icon: typeIcon })), item => item.type)
    case "assignee":
      return by([...PEOPLE.map(person => ({ id: person.id, label: person.name, icon: <PersonAvatar person={person} className="size-4" /> })),
        { id: "", label: "담당자 없음", icon: <UserIcon className="text-icon-muted" /> }], item => item.assignee?.id ?? "")
    case "none":
      return [{ id: "all", label: "전체", items }]
  }
}
