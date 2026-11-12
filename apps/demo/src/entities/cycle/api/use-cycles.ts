import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { addDays, cycleState, today, weekStartOf } from "../model/dates"
import type { Cycle, CycleInput, CycleList, CycleSettings } from "../model/types"
import { mockCyclesOf } from "./mock"

/** 프로젝트마다 사이클 목록과 설정을 한 캐시에 둔다(호호코워크 cyclesOptions와 같은 묶음). */
const listKey = (projectKey: string) => ["cycles", projectKey.toLowerCase()] as const

/** 서버가 없으므로 약 300ms 뒤에 목 데이터를 돌려준다. 이후 변경은 쿼리 캐시에만 남는다. */
const later = <T,>(value: T) => new Promise<T>(resolve => setTimeout(() => resolve(value), 300))

const byStart = (a: Cycle, b: Cycle) => a.startDate.localeCompare(b.startDate)

/** 프로젝트(주소의 소문자 키)의 사이클(시작이 이른 것부터)과 설정. */
export function useCycles(projectKey: string) {
  return useQuery({ queryKey: listKey(projectKey), queryFn: () => later(mockCyclesOf(projectKey.toLowerCase())), staleTime: Infinity })
}

function edit(client: QueryClient, projectKey: string, change: (list: CycleList) => CycleList) {
  const list = client.getQueryData<CycleList>(listKey(projectKey))
  if (!list) throw new Error("사이클을 아직 불러오지 못했습니다")
  const next = change(list)
  client.setQueryData<CycleList>(listKey(projectKey), { ...next, cycles: [...next.cycles].sort(byStart) })
  return next
}

const nextNumber = (cycles: Cycle[]) => Math.max(0, ...cycles.map(cycle => cycle.number)) + 1

/**
 * 켜진 설정대로 모자란 사이클을 채운다(호호코워크 서버가 하는 일): 오늘을 덮는 사이클이 없으면 이번 주 시작 요일부터 하나,
 * 그 뒤로 예정 사이클이 '미리 만들 사이클' 수가 될 때까지 이어 붙인다. 이미 있는 사이클은 건드리지 않는다.
 */
function fillCycles(cycles: Cycle[], settings: CycleSettings): Cycle[] {
  if (!settings.isEnabled) return cycles
  const on = today()
  const length = settings.weeks * 7
  const result = [...cycles].sort(byStart)
  const append = (startDate: string) => {
    const number = nextNumber(result)
    result.push({ id: `cycle-${Date.now()}-${number}`, number, name: `${number}차 사이클`, startDate, endDate: addDays(startDate, length - 1), workItemKeys: [] })
  }
  const lastEnd = () => result.at(-1)?.endDate
  if (!result.some(cycle => cycle.endDate >= on)) {
    const thisWeek = weekStartOf(on, settings.startDay)
    const after = lastEnd()
    append(after && after >= thisWeek ? addDays(after, 1) : thisWeek)
  }
  while (result.filter(cycle => cycleState(cycle, on) === "upcoming").length < settings.upcoming) append(addDays(lastEnd()!, 1))
  return result
}

/** 새 사이클을 만들거나(id 없음) 이름 · 목표 · 날짜를 고친다. */
export function useSaveCycle(projectKey: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: CycleInput }) => {
      if (input.startDate > input.endDate) throw new Error("종료일은 시작일보다 늦어야 합니다")
      edit(client, projectKey, list => ({
        ...list,
        cycles: id
          ? list.cycles.map(cycle => (cycle.id === id ? { ...cycle, ...input } : cycle))
          : [...list.cycles, { ...input, id: `cycle-${Date.now()}`, number: nextNumber(list.cycles), workItemKeys: [] }],
      }))
      return input
    },
  })
}

/**
 * 사이클을 마친다. 끝내지 못한 업무(unfinished)는 moveTo 사이클로 옮기거나, 없으면 어느 사이클에도 넣지 않는다.
 * 업무의 상태는 업무 캐시가 알므로 부르는 쪽이 넘긴다. 옮긴 개수를 돌려준다.
 */
export function useCompleteCycle(projectKey: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, unfinished, moveTo }: { id: string; unfinished: string[]; moveTo?: string }) => {
      edit(client, projectKey, list => ({
        ...list,
        cycles: list.cycles.map(cycle => {
          if (cycle.id === id) return { ...cycle, completedAt: today(), workItemKeys: cycle.workItemKeys.filter(key => !unfinished.includes(key)) }
          if (cycle.id === moveTo) return { ...cycle, workItemKeys: [...cycle.workItemKeys, ...unfinished] }
          return cycle
        }),
      }))
      return { moved: moveTo ? unfinished.length : 0 }
    },
  })
}

/** 사이클을 지운다. 업무는 지우지 않고 사이클에서만 빠진다. */
export function useDeleteCycle(projectKey: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      edit(client, projectKey, list => ({ ...list, cycles: list.cycles.filter(cycle => cycle.id !== id) }))
      return id
    },
  })
}

/** 사이클 설정을 저장한다. 켜져 있으면 설정대로 모자란 사이클을 바로 만든다. */
export function useSaveCycleSettings(projectKey: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (settings: CycleSettings) => {
      const next = edit(client, projectKey, list => ({ settings, cycles: fillCycles(list.cycles, settings) }))
      return next.settings
    },
  })
}
