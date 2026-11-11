import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { NewWorkItem, WorkItem } from "../model/types"
import { mockWorkItems, PROJECT_KEY } from "./mock"

const key = ["work-items", PROJECT_KEY] as const

/** 서버가 없으므로 약 300ms 뒤에 목 데이터를 돌려준다. 이후 변경은 쿼리 캐시에만 남는다. */
export function useWorkItems() {
  return useQuery({
    queryKey: key,
    queryFn: () => new Promise<WorkItem[]>(resolve => setTimeout(() => resolve(mockWorkItems), 300)),
    staleTime: Infinity,
  })
}

/** 새 업무를 다음 번호로 만들어 캐시 맨 앞에 넣는다. */
export function useCreateWorkItem() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewWorkItem): Promise<WorkItem> => {
      const items = client.getQueryData<WorkItem[]>(key) ?? []
      const number = Math.max(0, ...items.map(item => item.number)) + 1
      return { ...input, id: `work-item-${number}`, key: `${PROJECT_KEY}-${number}`, number, updatedAt: new Date().toISOString() }
    },
    onSuccess: item => client.setQueryData<WorkItem[]>(key, old => [item, ...(old ?? [])]),
  })
}
