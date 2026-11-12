import { CircleCheckIcon, CirclePauseIcon, CircleXIcon, ClockIcon, RefreshCwIcon, type Icon } from "@/shared/ui/icon"
import type { MarkTone } from "./marks"
import type { WorkItem, WorkItemStatus } from "./types"

/** 상태의 분류(호호코워크 ColumnCategory): 아이콘 · 색, 업무를 닫는지(완료 · 취소)를 정한다. 이름은 칸마다 프로젝트가 붙인다. */
export type ColumnCategory = "BACKLOG" | "UNSTARTED" | "STARTED" | "COMPLETED" | "CANCELED"

/** 분류: 원 모양 아이콘 한 가족(멈춤 · 시계 · 회전 · 체크 · 엑스). 할 일은 색 없이 보조 아이콘 색. */
export const CATEGORIES: readonly { value: ColumnCategory; label: string; icon: Icon; tone?: MarkTone }[] = [
  { value: "BACKLOG", label: "백로그", icon: CirclePauseIcon, tone: "text-mark-backlog" },
  { value: "UNSTARTED", label: "할 일", icon: ClockIcon },
  { value: "STARTED", label: "진행 중", icon: RefreshCwIcon, tone: "text-mark-progress" },
  { value: "COMPLETED", label: "완료", icon: CircleCheckIcon, tone: "text-mark-done" },
  { value: "CANCELED", label: "취소", icon: CircleXIcon, tone: "text-mark-backlog" },
]
export const categoryMark = (category: ColumnCategory) => CATEGORIES.find(each => each.value === category) ?? CATEGORIES[0]

/** 닫힌 업무(완료 · 취소): 남은 일로 세지 않는다. */
export const isClosedCategory = (category: ColumnCategory) => category === "COMPLETED" || category === "CANCELED"

/** 보드의 칸 하나(호호코워크 BoardColumn). 업무의 status가 이 id다. */
export type WorkflowColumn = { id: WorkItemStatus; name: string; category: ColumnCategory }

export const COLUMN_NAME_MAX = 32

/** 새 프로젝트의 칸. id는 목 데이터의 상태 값과 같아 그대로 이어진다. */
export const DEFAULT_WORKFLOW: readonly WorkflowColumn[] = [
  { id: "backlog", name: "백로그", category: "BACKLOG" },
  { id: "todo", name: "할 일", category: "UNSTARTED" },
  { id: "in_progress", name: "진행 중", category: "STARTED" },
  { id: "done", name: "완료", category: "COMPLETED" },
]

/**
 * 상태 id의 칸. 칸이 지워졌으면(또는 주소의 ?status=처럼 모르는 값이면) 기본 칸의 분류로 그 분류의 첫 칸을, 그것도 없으면 첫 칸을 고른다.
 * 업무가 남은 칸은 지우지 못하므로 이 대체는 기본 id를 가리키는 값이 대부분이다.
 */
export function columnOf(columns: readonly WorkflowColumn[], status: WorkItemStatus): WorkflowColumn {
  const exact = columns.find(column => column.id === status)
  if (exact) return exact
  const category = DEFAULT_WORKFLOW.find(column => column.id === status)?.category
  return columns.find(column => column.category === category) ?? columns[0] ?? DEFAULT_WORKFLOW[0]
}

/** 새 업무가 처음 놓이는 칸: 첫 할 일, 없으면 첫 칸. */
export const initialColumn = (columns: readonly WorkflowColumn[]) =>
  columns.find(column => column.category === "UNSTARTED") ?? columns[0] ?? DEFAULT_WORKFLOW[0]

/** 그 칸에 놓인 업무 수(프로젝트의 업무를 넘긴다). 업무가 남은 칸은 지우지 않는다. */
export const countInColumn = (items: readonly WorkItem[] | undefined, columnId: string) =>
  (items ?? []).filter(item => item.status === columnId).length
