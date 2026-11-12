import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { changesOf } from "../model/activity"
import { projectKeyOf as projectOf } from "../model/key"
import { ME } from "../model/marks"
import type { NewWorkItem, WorkItem, WorkItemActivity, WorkItemPatch } from "../model/types"
import { workItemsKey } from "./keys"
import { mockActivityOf, mockWorkItems } from "./mock"
import { cachedColumns } from "./use-workflow"

const listKey = workItemsKey
const activityKey = (key: string) => [...listKey, key, "activity"] as const

/** 서버가 없으므로 약 300ms 뒤에 목 데이터를 돌려준다. 이후 변경은 쿼리 캐시에만 남는다. */
const later = <T,>(value: T) => new Promise<T>(resolve => setTimeout(() => resolve(value), 300))

const listOptions = { queryKey: listKey, queryFn: () => later(mockWorkItems), staleTime: Infinity }

/** 프로젝트(주소의 소문자 키) 하나의 업무. 키를 비우면 회사의 모든 업무(전역 검색). */
export function useWorkItems(projectKey?: string) {
  const wanted = projectKey?.toLowerCase()
  return useQuery({ ...listOptions, select: (items: WorkItem[]) => (wanted ? items.filter(item => projectOf(item.key) === wanted) : items) })
}

/** 키 하나의 업무. 목록과 같은 캐시를 읽으므로 상세에서 바꾸면 목록도 바뀐다. 읽는 동안 undefined, 없으면 null. */
export function useWorkItem(key: string) {
  return useQuery({ ...listOptions, select: (items: WorkItem[]) => items.find(item => item.key === key) ?? null })
}

const findItem = (client: QueryClient, key: string) => client.getQueryData<WorkItem[]>(listKey)?.find(item => item.key === key)

/** 업무의 활동(오래된 것부터). 목 데이터는 캐시의 업무로 만든다. */
export function useWorkItemActivity(key: string) {
  const client = useQueryClient()
  return useQuery({
    queryKey: activityKey(key),
    queryFn: async () => {
      const item = (await client.ensureQueryData(listOptions)).find(each => each.key === key)
      return later(item ? mockActivityOf(item) : [])
    },
    staleTime: Infinity,
  })
}

const appendActivity = (client: QueryClient, key: string, entries: WorkItemActivity[]) =>
  client.setQueryData<WorkItemActivity[]>(activityKey(key), old => (old ? [...old, ...entries] : old))

/** 새 업무를 그 프로젝트의 다음 번호로 만들어 캐시 맨 앞에 넣는다. 목록을 아직 읽지 않았으면(새 업무 페이지로 바로 온 경우) 먼저 읽는다. */
export function useCreateWorkItem(projectKey: string) {
  const prefix = projectKey.toLowerCase()
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewWorkItem): Promise<WorkItem> => {
      const items = await client.ensureQueryData(listOptions)
      const number = Math.max(0, ...items.filter(item => projectOf(item.key) === prefix).map(item => item.number)) + 1
      return { ...input, id: `work-item-${prefix}-${number}`, key: `${prefix}-${number}`, number, updatedAt: new Date().toISOString() }
    },
    onSuccess: item => client.setQueryData<WorkItem[]>(listKey, old => [item, ...(old ?? [])]),
  })
}

/** 속성을 바꾼다. 캐시의 업무를 고치고, 바꾼 속성마다 "나"의 활동 한 줄을 남긴다(상태는 그때의 칸 이름으로). */
export function useUpdateWorkItem() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ key, patch }: { key: string; patch: WorkItemPatch }) => {
      const item = findItem(client, key)
      if (!item) throw new Error(`${key} 업무가 없습니다`)
      return { item, patch, at: new Date().toISOString() }
    },
    onSuccess: ({ item, patch, at }) => {
      client.setQueryData<WorkItem[]>(listKey, old => old?.map(each => (each.key === item.key ? { ...each, ...patch, updatedAt: at } : each)))
      appendActivity(client, item.key, changesOf(item, patch, cachedColumns(client, projectOf(item.key))).map(change => ({
        ...change, kind: "changed" as const, id: `${item.key}-${change.field}-${at}`, at, actor: ME,
      })))
    },
  })
}

/** 댓글을 "나"의 이름으로 활동 끝에 붙인다. */
export function useAddWorkItemComment() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ key, body }: { key: string; body: string }) => ({ key, body, at: new Date().toISOString() }),
    onSuccess: ({ key, body, at }) => appendActivity(client, key, [{ id: `${key}-comment-${at}`, kind: "comment", body, at, actor: ME }]),
  })
}

/** 업무를 캐시에서 지운다. */
export function useDeleteWorkItem() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (key: string) => key,
    onSuccess: key => {
      client.setQueryData<WorkItem[]>(listKey, old => old?.filter(item => item.key !== key))
      client.removeQueries({ queryKey: activityKey(key) })
    },
  })
}
