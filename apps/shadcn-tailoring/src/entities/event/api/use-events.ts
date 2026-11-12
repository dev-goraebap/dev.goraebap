import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { CalendarEvent, NewCalendarEvent } from "../model/types"
import { mockEvents } from "./mock"

const key = ["events"] as const

/** 서버가 없으므로 약 300ms 뒤에 목 데이터를 돌려준다. 이후 변경은 쿼리 캐시에만 남는다. */
const eventsQuery = {
  queryKey: key,
  queryFn: () => new Promise<CalendarEvent[]>(resolve => setTimeout(() => resolve(mockEvents()), 300)),
  staleTime: Infinity,
}

/** 회사 일정. */
export function useEvents() {
  return useQuery(eventsQuery)
}

/**
 * 일정 하나(/schedule/events/{id}). 따로 읽는 길이 없어 목록 캐시에서 고른다: 읽는 중 undefined, 없으면 null.
 * 목 데이터의 번호는 처음 읽을 때 매기므로 새로고침해도 같은 주소가 같은 일정을 가리킨다.
 */
export function useEvent(id: string) {
  return useQuery({ ...eventsQuery, select: (events: CalendarEvent[]) => events.find(event => event.id === id) ?? null })
}

/** 새 일정을 만들어 캐시에 더한다. */
export function useCreateEvent() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewCalendarEvent): Promise<CalendarEvent> => ({ ...input, id: `event-new-${Date.now()}` }),
    onSuccess: event => client.setQueryData<CalendarEvent[]>(key, old => [...(old ?? []), event]),
  })
}
