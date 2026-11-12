import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { monthlyUsage, summarize, withAvailable } from "../model/summary"
import { todayIso } from "../model/text"
import type { AttendanceDay, LeaveRequest, NewLeaveRequest } from "../model/types"
import { mockAttendance, mockGrant, mockLine, mockRequests, mockSpecialTypes } from "./mock"

const keys = {
  requests: ["leave", "requests"] as const,
  grant: ["leave", "grant"] as const,
  types: ["leave", "types"] as const,
  line: ["leave", "line"] as const,
  attendance: ["leave", "attendance"] as const,
}

/** 서버가 없으므로 약 300ms 뒤에 목 데이터를 돌려준다. 이후 변경은 쿼리 캐시에만 남는다. */
const later = <T,>(value: T) => new Promise<T>(resolve => setTimeout(() => resolve(value), 300))

const requestsOptions = { queryKey: keys.requests, queryFn: () => later(mockRequests), staleTime: Infinity }
const typesOptions = { queryKey: keys.types, queryFn: () => later(mockSpecialTypes), staleTime: Infinity }

/** 내 휴가 신청(새 것이 위). 새 신청이 겹치면 안 되는 날도 여기서 읽는다. */
export function useLeaveRequests() {
  return useQuery(requestsOptions)
}

/**
 * 올해 연차 현황. 부여는 회사 설정에서, 사용과 결재 중은 신청 목록에서 센다.
 * 그래서 새 신청이 캐시에 들어가면 결재 중과 신청 가능이 바로 바뀐다.
 */
export function useLeaveSummary() {
  const grant = useQuery({ queryKey: keys.grant, queryFn: () => later(mockGrant), staleTime: Infinity })
  const requests = useLeaveRequests()
  const data = grant.data && requests.data ? summarize(grant.data, requests.data) : undefined
  return { data, isPending: grant.isPending || requests.isPending, isError: grant.isError || requests.isError }
}

/** 신청할 수 있는 특별휴가(호호코워크 specialCatalog). 미리 받은 휴가는 신청 목록으로 남은 일수를 센다. */
export function useSpecialTypes() {
  const types = useQuery(typesOptions)
  const requests = useLeaveRequests()
  const data = types.data && requests.data ? withAvailable(types.data, requests.data) : undefined
  return { data, isPending: types.isPending || requests.isPending, isError: types.isError || requests.isError }
}

/** 조직이 정한 내 결재선(호호코워크 suggestedLine). 양식이 열릴 때마다 처음 결재선이 된다. 비면 결재 없이 승인된다. */
export function useSuggestedLine() {
  return useQuery({ queryKey: keys.line, queryFn: () => later(mockLine), staleTime: 0 })
}

/** 한 해의 월별 휴가 사용(승인된 것만, 오늘 뒤는 예정). closed는 공휴일로, 근무일 기준 휴가가 세지 않는다. */
export function useLeaveUsage(year: number, closed: ReadonlySet<string>) {
  const types = useQuery(typesOptions)
  return useQuery({
    ...requestsOptions,
    select: (requests: LeaveRequest[]) => monthlyUsage(year, requests, todayIso(), closed, types.data ?? []),
  })
}

/** 한 달(2026-11)의 출퇴근 기록, 최근 날부터. 공휴일(closed)에는 출근하지 않았다. */
export function useAttendance(month: string, closed: ReadonlySet<string>) {
  return useQuery({
    queryKey: keys.attendance,
    queryFn: () => later(mockAttendance(todayIso())),
    staleTime: Infinity,
    select: (days: AttendanceDay[]) => days.filter(day => day.date.startsWith(month) && !closed.has(day.date)),
  })
}

/**
 * 휴가를 신청한다. 결재선이 있으면 승인 대기로, 없으면 바로 승인으로 목록 맨 위에 넣는다.
 * 미리 받은 특별휴가의 남은 일수도 같은 목록에서 세므로 함께 바뀐다.
 */
export function useRequestLeave() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: NewLeaveRequest) => later<LeaveRequest>({
      ...input,
      id: `leave-${Date.now()}`,
      status: input.approvers.length === 0 ? "approved" : "pending",
      requestedAt: new Date().toISOString(),
    }),
    onSuccess: request => client.setQueryData<LeaveRequest[]>(keys.requests, old => [request, ...(old ?? [])]),
  })
}
