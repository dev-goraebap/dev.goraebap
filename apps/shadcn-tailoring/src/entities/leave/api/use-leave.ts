import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { monthlyUsage, summarize } from "../model/summary"
import { leaveDays, todayIso } from "../model/text"
import type { AttendanceDay, LeaveRequest, NewLeaveRequest } from "../model/types"
import { mockAttendance, mockGrant, mockRequests } from "./mock"

const keys = {
  requests: ["leave", "requests"] as const,
  grant: ["leave", "grant"] as const,
  attendance: ["leave", "attendance"] as const,
}

/** 서버가 없으므로 약 300ms 뒤에 목 데이터를 돌려준다. 이후 변경은 쿼리 캐시에만 남는다. */
const later = <T,>(value: T) => new Promise<T>(resolve => setTimeout(() => resolve(value), 300))

const requestsOptions = { queryKey: keys.requests, queryFn: () => later(mockRequests), staleTime: Infinity }

/** 내 휴가 신청(새 것이 위). */
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

/** 한 해의 월별 휴가 사용(승인된 것만, 오늘 뒤는 예정). */
export function useLeaveUsage(year: number) {
  return useQuery({ ...requestsOptions, select: (requests: LeaveRequest[]) => monthlyUsage(year, requests, todayIso()) })
}

/** 한 달(2026-11)의 출퇴근 기록, 최근 날부터. */
export function useAttendance(month: string) {
  return useQuery({
    queryKey: keys.attendance,
    queryFn: () => later(mockAttendance(todayIso())),
    staleTime: Infinity,
    select: (days: AttendanceDay[]) => days.filter(day => day.date.startsWith(month)),
  })
}

/** 휴가를 신청한다. 승인 대기로 목록 맨 위에 넣는다. 결재자는 팀장이다. */
export function useRequestLeave() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: NewLeaveRequest) => later<LeaveRequest>({
      ...input,
      id: `leave-${Date.now()}`,
      endDate: input.type === "half" ? input.startDate : input.endDate,
      days: leaveDays(input.type, input.startDate, input.type === "half" ? input.startDate : input.endDate),
      status: "pending",
      approver: "이도윤",
      requestedAt: new Date().toISOString(),
    }),
    onSuccess: request => client.setQueryData<LeaveRequest[]>(keys.requests, old => [request, ...(old ?? [])]),
  })
}
