import type { LeaveGrant } from "../model/summary"
import { isoOf, leaveDays } from "../model/text"
import type { AttendanceDay, HalfDay, LeaveRequest, LeaveStatus, LeaveType } from "../model/types"

/* "나"(고재범)의 올해 연차와 휴가 신청, 최근 출퇴근 기록. 서버가 없으므로 여기서 만든다. */

export const mockGrant: LeaveGrant = {
  granted: 20, expiringDays: 2, expiringDate: "2026-12-31", nextGrantDays: 16, nextGrantDate: "2027-01-01",
}

type Seed = [type: LeaveType, start: string, end: string, status: LeaveStatus, reason: string, half?: HalfDay, note?: string]

const SEEDS: Seed[] = [
  ["annual", "2026-01-26", "2026-01-27", "approved", "설 연휴 앞뒤로 가족 방문"],
  ["half", "2026-03-13", "2026-03-13", "approved", "병원 검진", "am"],
  ["annual", "2026-05-04", "2026-05-06", "approved", "가족 여행"],
  ["sick", "2026-06-17", "2026-06-17", "approved", "감기 몸살"],
  ["annual", "2026-08-10", "2026-08-14", "approved", "여름 휴가. 급한 일은 김하늘 님께 넘겼습니다."],
  ["half", "2026-09-25", "2026-09-25", "approved", "이사 준비", "pm"],
  ["annual", "2026-10-19", "2026-10-19", "rejected", "개인 일정", undefined, "릴리스 주간이라 다음 주로 옮겨 주세요."],
  ["annual", "2026-10-26", "2026-10-26", "approved", "개인 일정(지난주 반려 건을 옮김)"],
  ["half", "2026-11-06", "2026-11-06", "approved", "은행 업무", "pm"],
  ["annual", "2026-11-23", "2026-11-24", "pending", "가족 행사"],
  ["annual", "2026-12-24", "2026-12-24", "approved", "연말 휴가"],
]

/** 신청은 쉬는 날의 일주일 전에 올렸다. */
const weekBefore = (iso: string) => {
  const day = new Date(`${iso}T09:00:00`)
  day.setDate(day.getDate() - 7)
  return day.toISOString()
}

/** 새 것이 위로(쉬는 날이 늦은 것부터). */
export const mockRequests: LeaveRequest[] = SEEDS.map(([type, startDate, endDate, status, reason, half, note], index) => ({
  id: `leave-${index + 1}`, type, half, startDate, endDate, days: leaveDays(type, startDate, endDate), reason, status, note,
  approver: "이도윤", requestedAt: weekBefore(startDate),
})).reverse()

/** 0 ≤ n < 1을 날짜에서 정한다(새로 그려도 같은 기록). */
const noise = (day: Date, salt: number) => ((day.getDate() * 37 + day.getMonth() * 101 + salt * 53) % 97) / 97
const time = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`

const OVERTIME_REASONS = ["릴리스 준비", "장애 대응", "고객사 회의 자료 정리", "배포 뒤 모니터링"]

/** 하루 휴가(승인)인 날. 반차인 날도 출퇴근은 남는다. */
const isOnLeave = (iso: string) => mockRequests.some(request => request.status === "approved" && request.type !== "half"
  && request.startDate <= iso && iso <= request.endDate)

/**
 * 9월 1일부터 어제까지 근무일의 출퇴근. 출근은 08:50~09:10, 퇴근은 대개 18시 무렵이고 며칠은 늦게까지 남는다.
 * 18시 이후 한 시간 넘게 남은 날은 연장근무(30분 단위, 저녁 30분은 빼고)이며, 지난주까지는 결재가 끝났고 이번 주는 승인 대기다.
 */
export function mockAttendance(today: string): AttendanceDay[] {
  const days: AttendanceDay[] = []
  const weekAgo = new Date(`${today}T00:00:00`)
  weekAgo.setDate(weekAgo.getDate() - 7)
  for (const day = new Date("2026-09-01T00:00:00"); isoOf(day) < today; day.setDate(day.getDate() + 1)) {
    const iso = isoOf(day)
    if (day.getDay() === 0 || day.getDay() === 6 || isOnLeave(iso)) continue
    const clockIn = 8 * 60 + 50 + Math.floor(noise(day, 1) * 21)
    const isLate = noise(day, 2) > 0.72
    const clockOut = isLate ? 19 * 60 + 30 + Math.floor(noise(day, 3) * 6) * 30 : 18 * 60 + Math.floor(noise(day, 4) * 15)
    const overtime = isLate ? Math.floor((clockOut - 18 * 60 - 30) / 30) * 30 : 0
    const reason = OVERTIME_REASONS[day.getDate() % OVERTIME_REASONS.length]
    const status: LeaveStatus | undefined = overtime === 0 ? undefined
      : day > weekAgo ? "pending" : day.getDate() === 15 ? "rejected" : "approved"
    days.push({
      date: iso, clockIn: time(clockIn), clockOut: time(clockOut), overtimeMinutes: overtime,
      overtimeStatus: status, overtimeReason: overtime ? reason : undefined,
    })
  }
  return days.reverse()
}
