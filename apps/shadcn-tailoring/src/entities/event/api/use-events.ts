import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { CalendarEvent, NewCalendarEvent } from "../model/types"
import { mockEvents } from "./mock"

const key = ["events"] as const

/** 회사 일정. 서버가 없으므로 약 300ms 뒤에 목 데이터를 돌려준다. 이후 변경은 쿼리 캐시에만 남는다. */
export function useEvents() {
  return useQuery({
    queryKey: key,
    queryFn: () => new Promise<CalendarEvent[]>(resolve => setTimeout(() => resolve(mockEvents()), 300)),
    staleTime: Infinity,
  })
}

/** 새 일정을 만들어 캐시에 더한다. */
export function useCreateEvent() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewCalendarEvent): Promise<CalendarEvent> => ({ ...input, id: `event-new-${Date.now()}` }),
    onSuccess: event => client.setQueryData<CalendarEvent[]>(key, old => [...(old ?? []), event]),
  })
}
