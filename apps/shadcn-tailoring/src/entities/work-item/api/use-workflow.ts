import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { projectKeyOf } from "../model/key"
import type { WorkItem } from "../model/types"
import { columnOf, countInColumn, DEFAULT_WORKFLOW, type ColumnCategory, type WorkflowColumn } from "../model/workflow"
import { workflowKey, workItemsKey } from "./keys"

/*
 * 프로젝트의 워크플로(보드 칸들). 서버가 없으므로 기본 칸에서 시작해 이후 변경은 쿼리 캐시에만 남긴다(프로젝트마다).
 * 보드 · 목록 · 필터 · 상태 고르기가 모두 이 캐시를 읽으므로 설정에서 고치면 곧바로 따라온다.
 * 지켜보는 화면이 없어도 캐시를 지우지 않는다(gcTime). 지우면 고친 칸이 기본 칸으로 돌아간다.
 */
const later = <T,>(value: T) => new Promise<T>(resolve => setTimeout(() => resolve(value), 300))

export function useWorkflow(projectKey: string) {
  return useQuery({ queryKey: workflowKey(projectKey), queryFn: () => later([...DEFAULT_WORKFLOW]), staleTime: Infinity, gcTime: Infinity })
}

/** 화면이 그릴 칸들. 읽는 동안은 기본 칸이다(처음 읽는 값도 기본 칸이라 바뀌어 보이지 않는다). */
export function useStatusColumns(projectKey: string): readonly WorkflowColumn[] {
  return useWorkflow(projectKey).data ?? DEFAULT_WORKFLOW
}

/** 업무 하나가 놓인 칸. 키에서 프로젝트를 읽으므로 상태 id만 든 줄도 칸 이름과 분류를 안다. */
export function useItemColumn(item: Pick<WorkItem, "key" | "status">): WorkflowColumn {
  return columnOf(useStatusColumns(projectKeyOf(item.key)), item.status)
}

/** 캐시의 칸들(활동 글자처럼 훅 밖에서 이름이 필요할 때). */
export const cachedColumns = (client: QueryClient, projectKey: string) =>
  client.getQueryData<WorkflowColumn[]>(workflowKey(projectKey)) ?? DEFAULT_WORKFLOW

const setColumns = (client: QueryClient, projectKey: string, change: (columns: WorkflowColumn[]) => WorkflowColumn[]) =>
  client.setQueryData<WorkflowColumn[]>(workflowKey(projectKey), old => change(old ?? [...DEFAULT_WORKFLOW]))

/** 칸을 더하거나(id 없이) 고친다. 새 칸은 맨 끝이다. */
export function useSaveWorkflowColumn(projectKey: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { id?: string; name: string; category: ColumnCategory }) => later(input),
    onSuccess: ({ id, name, category }) => setColumns(client, projectKey, columns => (id
      ? columns.map(column => (column.id === id ? { ...column, name, category } : column))
      : [...columns, { id: `column-${Date.now()}`, name, category }])),
  })
}

/** 칸을 지운다. 마지막 칸이거나 업무가 남았으면 서버가 하듯 거절한다(화면은 미리 막는다). */
export function useDeleteWorkflowColumn(projectKey: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (cachedColumns(client, projectKey).length <= 1) throw new Error("마지막 상태는 삭제하지 않습니다.")
      const items = client.getQueryData<WorkItem[]>(workItemsKey)?.filter(item => projectKeyOf(item.key) === projectKey.toLowerCase())
      if (countInColumn(items, id) > 0) throw new Error("이 상태에 업무가 남아 있습니다.")
      return later(id)
    },
    onSuccess: id => setColumns(client, projectKey, columns => columns.filter(column => column.id !== id)),
  })
}

/** 칸의 순서를 바꾼다. 화면이 바로 따라오도록 캐시를 먼저 고친다. */
export function useOrderWorkflowColumns(projectKey: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) => ids,
    onMutate: ids => setColumns(client, projectKey, columns => {
      const byId = new Map(columns.map(column => [column.id, column]))
      return ids.map(id => byId.get(id)).filter((column): column is WorkflowColumn => !!column)
    }),
  })
}
