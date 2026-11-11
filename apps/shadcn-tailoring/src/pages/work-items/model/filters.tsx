import type { ReactNode } from "react"
import {
  LABELS, ME, PEOPLE, PRIORITIES, STATUSES, TYPES, PersonAvatar, WorkItemLabelDot, WorkItemPriorityIcon, WorkItemStatusIcon,
  type WorkItem, type WorkItemPriority,
} from "@/entities/work-item"
import { ChartNoAxesColumnIcon, ListChecksIcon, SquareCheckIcon, TagIcon, UserIcon, type Icon } from "@/shared/ui/icon"

export type FilterOption = { value: string; label: string; icon?: ReactNode }
export type ListFilter = { key: FilterKey; label: string; icon: Icon; options: FilterOption[]; isSearchable?: boolean }
export type FilterKey = "status" | "assignee" | "label" | "type" | "priority"
/** 필터마다 고른 값. 비었으면 걸리지 않은 것이다. */
export type FilterState = Partial<Record<FilterKey, string[]>>

const typeIcon = <ListChecksIcon className="text-icon-muted" />

/** 이 프로젝트의 필터(호호코워크 projectFilters): 상태 · 담당자 · 라벨 · 유형 · 우선순위. */
export const FILTERS: ListFilter[] = [
  { key: "status", label: "상태", icon: SquareCheckIcon,
    options: STATUSES.map(status => ({ value: status.value, label: status.label, icon: <WorkItemStatusIcon status={status.value} /> })) },
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

export const filterOf = (key: FilterKey) => FILTERS.find(filter => filter.key === key)!
export const activeKeys = (state: FilterState) => FILTERS.filter(filter => (state[filter.key]?.length ?? 0) > 0).map(filter => filter.key)

/** 고른 값 이름: 둘까지 보이고 나머지는 +N. */
export function chosenNames(key: FilterKey, values: string[] = []) {
  const names = values.map(value => filterOf(key).options.find(option => option.value === value)?.label ?? value)
  return { shown: names.slice(0, 2).join(", "), more: Math.max(0, names.length - 2) }
}

/** 필터가 통과시키는 업무(서버가 하듯). 담당자의 "나"는 ME다. */
export function applyFilters(items: WorkItem[], state: FilterState) {
  const any = (key: FilterKey, value: string) => !state[key]?.length || state[key].includes(value)
  const person = (item: WorkItem) => !state.assignee?.length || state.assignee.some(value =>
    value === "none" ? !item.assignee : value === "me" ? item.assignee?.id === ME.id : value === item.assignee?.id)
  return items.filter(item => any("status", item.status) && any("priority", item.priority) && any("type", item.type) && person(item)
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

/** 표시의 그룹대로 나눈다. 비어 있는 그룹은 뺀다. */
export function groupItems(items: WorkItem[], group: GroupKey): WorkItemGroup[] {
  const by = (list: Omit<WorkItemGroup, "items">[], idOf: (item: WorkItem) => string) =>
    list.map(each => ({ ...each, items: items.filter(item => idOf(item) === each.id) })).filter(each => each.items.length > 0)
  switch (group) {
    case "status":
      return by(STATUSES.map(status => ({ id: status.value, label: status.label, icon: <WorkItemStatusIcon status={status.value} /> })), item => item.status)
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
