import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { STATUSES, type WorkItemStatus } from "@/entities/work-item"
import { CircleCheckIcon, CirclePauseIcon, CircleXIcon, ClockIcon, RefreshCwIcon, type Icon } from "@/shared/ui/icon"

/** 상태의 분류(호호코워크 ColumnCategory): 업무를 닫는지(완료 · 취소)와 목록의 묶음을 정한다. */
export type ColumnCategory = "BACKLOG" | "UNSTARTED" | "STARTED" | "COMPLETED" | "CANCELED"

export const CATEGORIES: readonly { value: ColumnCategory; label: string; icon: Icon; tone: string }[] = [
  { value: "BACKLOG", label: "백로그", icon: CirclePauseIcon, tone: "text-mark-backlog" },
  { value: "UNSTARTED", label: "할 일", icon: ClockIcon, tone: "text-icon-muted" },
  { value: "STARTED", label: "진행 중", icon: RefreshCwIcon, tone: "text-mark-progress" },
  { value: "COMPLETED", label: "완료", icon: CircleCheckIcon, tone: "text-mark-done" },
  { value: "CANCELED", label: "취소", icon: CircleXIcon, tone: "text-mark-backlog" },
]
export const categoryMark = (category: ColumnCategory) => CATEGORIES.find(each => each.value === category) ?? CATEGORIES[0]

/** 보드의 칸 하나. status는 업무 entity의 상태와 이어진 처음 칸에만 있다(그 칸에 남은 업무를 센다). */
export type BoardColumn = { id: string; name: string; category: ColumnCategory; status?: WorkItemStatus }

export const COLUMN_NAME_MAX = 32

const CATEGORY_OF: Record<WorkItemStatus, ColumnCategory> = { backlog: "BACKLOG", todo: "UNSTARTED", in_progress: "STARTED", done: "COMPLETED" }

/*
 * 업무 entity의 상태(STATUSES)는 고정이라, 칸의 추가 · 수정 · 삭제 · 순서는 이 쪽의 캐시에만 남긴다(프로젝트마다).
 * 보드와 업무 목록의 칸은 그대로다. 저장소 연동의 자동 이동 규칙이 이 칸들을 고른다.
 */
const columnsKey = (projectKey: string) => ["project-settings", "workflow", projectKey.toUpperCase()] as const
const later = <T,>(value: T) => new Promise<T>(resolve => setTimeout(() => resolve(value), 300))

const initialColumns = (): BoardColumn[] =>
  STATUSES.map(status => ({ id: status.value, name: status.label, category: CATEGORY_OF[status.value], status: status.value }))

export function useWorkflowColumns(projectKey: string) {
  return useQuery({ queryKey: columnsKey(projectKey), queryFn: () => later(initialColumns()), staleTime: Infinity })
}

/** 칸을 더하거나(column 없이) 고친다. 새 칸은 맨 끝이다. */
export function useSaveColumn(projectKey: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { id?: string; name: string; category: ColumnCategory }) => later(input),
    onSuccess: ({ id, name, category }) => client.setQueryData<BoardColumn[]>(columnsKey(projectKey), old => {
      const columns = old ?? []
      if (id) return columns.map(column => (column.id === id ? { ...column, name, category } : column))
      return [...columns, { id: `column-${Date.now()}`, name, category }]
    }),
  })
}

export function useDeleteColumn(projectKey: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => later(id),
    onSuccess: id => client.setQueryData<BoardColumn[]>(columnsKey(projectKey), old => old?.filter(column => column.id !== id)),
  })
}

/** 칸의 순서를 바꾼다. 화면이 바로 따라오도록 캐시를 먼저 고친다. */
export function useOrderColumns(projectKey: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) => ids,
    onMutate: ids => client.setQueryData<BoardColumn[]>(columnsKey(projectKey), old => {
      const byId = new Map((old ?? []).map(column => [column.id, column]))
      return ids.map(id => byId.get(id)).filter((column): column is BoardColumn => !!column)
    }),
  })
}
