import type { LeaveRequest, LeaveSummary, MonthUsage, SpecialType } from "./types"
import { addDays, isClosed, slotShare } from "./work-day"

/** 연차의 부여와 소멸 · 다음 부여(회사 설정). 사용과 결재 중은 신청에서 센다. */
export type LeaveGrant = Pick<LeaveSummary, "granted" | "expiringDays" | "expiringDate" | "nextGrantDays" | "nextGrantDate">

const sum = (requests: LeaveRequest[]) => requests.reduce((total, request) => total + request.days, 0)

/** 신청 목록으로 센 올해 연차. 승인된 것은 사용(앞으로 올 날도), 승인 대기는 결재 중, 반려는 세지 않는다. */
export function summarize(grant: LeaveGrant, requests: LeaveRequest[]): LeaveSummary {
  const annual = requests.filter(request => request.type === "annual")
  const used = sum(annual.filter(request => request.status === "approved"))
  const pending = sum(annual.filter(request => request.status === "pending"))
  const remaining = grant.granted - used
  return { ...grant, used, pending, remaining, available: remaining - pending }
}

/** 미리 받은 특별휴가에서 승인 · 결재 중인 것을 뺀 남은 일수. 받은 일수가 없는 휴가는 그대로 둔다. */
export function withAvailable(types: readonly SpecialType[], requests: LeaveRequest[]): SpecialType[] {
  return types.map(type => type.granted === undefined ? type
    : { ...type, available: type.granted - sum(requests.filter(request => request.type === type.id && request.status !== "rejected")) })
}

/**
 * 한 해의 승인된 휴가를 달마다 연차(반차 · 반반차 포함) · 그 외(특별휴가)로 나누고, 오늘 뒤의 날은 예정으로 따로 센다.
 * 근무일 기준 휴가는 주말 · 공휴일(closed)을 세지 않는다. 열두 달을 모두 돌려준다.
 */
export function monthlyUsage(year: number, requests: LeaveRequest[], today: string, closed: ReadonlySet<string>, types: readonly SpecialType[]): MonthUsage[] {
  const months = Array.from({ length: 12 }, (_, index): MonthUsage => ({ month: index + 1, annual: 0, other: 0, scheduled: 0, total: 0 }))
  for (const request of requests.filter(each => each.status === "approved")) {
    const countsAllDays = types.find(type => type.id === request.type)?.durationBasis === "CALENDAR_DAY"
    const share = slotShare[request.slot]
    for (let day = request.startDate; day <= request.endDate; day = addDays(day, 1)) {
      if (Number(day.slice(0, 4)) !== year || (!countsAllDays && isClosed(day, closed))) continue
      const month = months[Number(day.slice(5, 7)) - 1]
      if (day > today) month.scheduled += share
      else if (request.type === "annual") month.annual += share
      else month.other += share
      month.total += share
    }
  }
  return months
}

/** 막대 그래프의 위 끝: 가장 큰 값 이상인 1 · 2 · 5 × 10ⁿ, 적어도 floor. */
export function scaleTop(values: readonly number[], floor = 2) {
  const largest = Math.max(floor, ...values)
  const power = 10 ** Math.floor(Math.log10(largest))
  return [1, 2, 5, 10].map(step => step * power).find(top => top >= largest)!
}
