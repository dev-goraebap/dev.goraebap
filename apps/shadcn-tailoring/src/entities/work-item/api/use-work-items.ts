import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { changesOf } from "../model/activity"
import { ME } from "../model/marks"
import type { NewWorkItem, WorkItem, WorkItemActivity, WorkItemPatch } from "../model/types"
import { mockActivityOf, mockWorkItems, PROJECT_KEY } from "./mock"

const listKey = ["work-items", PROJECT_KEY] as const
const activityKey = (key: string) => [...listKey, key, "activity"] as const

/** 서버가 없으므로 약 300ms 뒤에 목 데이터를 돌려준다. 이후 변경은 쿼리 캐시에만 남는다. */
const later = <T,>(value: T) => new Promise<T>(resolve => setTimeout(() => resolve(value), 300))

const listOptions = { queryKey: listKey, queryFn: () => later(mockWorkItems), staleTime: Infinity }

export function useWorkItems() {
  return useQuery(listOptions)
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

/** 새 업무를 다음 번호로 만들어 캐시 맨 앞에 넣는다. 목록을 아직 읽지 않았으면(새 업무 페이지로 바로 온 경우) 먼저 읽는다. */
export function useCreateWorkItem() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewWorkItem): Promise<WorkItem> => {
      const items = await client.ensureQueryData(listOptions)
      const number = Math.max(0, ...items.map(item => item.number)) + 1
      return { ...input, id: `work-item-${number}`, key: `${PROJECT_KEY}-${number}`, number, updatedAt: new Date().toISOString() }
    },
    onSuccess: item => client.setQueryData<WorkItem[]>(listKey, old => [item, ...(old ?? [])]),
  })
}

/** 속성을 바꾼다. 캐시의 업무를 고치고, 바꾼 속성마다 "나"의 활동 한 줄을 남긴다. */
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
      appendActivity(client, item.key, changesOf(item, patch).map(change => ({
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
