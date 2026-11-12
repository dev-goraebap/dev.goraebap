import type { LeaveGrant } from "../model/summary"
import { isoOf } from "../model/text"
import type { Approver, AttendanceDay, LeaveRequest, LeaveSlot, LeaveStatus, LeaveType, SpecialType } from "../model/types"

/* "나"(고재범, 개발팀장)의 올해 연차와 휴가 신청, 특별휴가 목록, 최근 출퇴근 기록. 서버가 없으므로 여기서 만든다. */

export const mockGrant: LeaveGrant = {
  granted: 20, expiringDays: 2, expiringDate: "2026-12-31", nextGrantDays: 16, nextGrantDate: "2027-01-01",
}

/** 회사가 둔 특별휴가(호호코워크 특별휴가 설정). 미리 준 휴가(포상 · 대체)가 앞, 일이 생기면 쓰는 휴가가 뒤다. */
export const mockSpecialTypes: SpecialType[] = [
  { id: "reward", name: "포상휴가", description: "프로젝트 성과로 받은 휴가입니다. 받은 해 안에 씁니다.", durationBasis: "WORKING_DAY", granted: 3, requiresReason: false },
  { id: "substitute", name: "대체휴가", description: "휴일에 일한 날 대신 쉬는 날입니다.", durationBasis: "WORKING_DAY", granted: 1, requiresReason: false },
  { id: "sick", name: "병가", description: "아파서 쉽니다. 연차에서 빠지지 않고, 사흘이 넘으면 진단서를 결재자에게 냅니다.", durationBasis: "WORKING_DAY", requiresReason: true },
  { id: "family", name: "경조휴가", description: "결혼 · 출산 · 상 같은 경조사에 씁니다. 주말과 공휴일도 일수에 들어갑니다.", durationBasis: "CALENDAR_DAY", maxDays: 5, requiresReason: true },
]

/** 내 결재선: 개발팀장인 나의 위는 대표이사다(부서 위 부서의 장). */
export const mockLine: Approver[] = [{ id: "emp-han", name: "한지석" }]

/** 일수는 신청할 때 공휴일까지 빼고 센 값이다(5월 4~6일은 어린이날을 빼 2일). */
type Seed = [type: LeaveType, slot: LeaveSlot, start: string, end: string, days: number, status: LeaveStatus, reason: string, note?: string]

const SEEDS: Seed[] = [
  ["annual", "FULL_DAY", "2026-01-26", "2026-01-27", 2, "approved", "가족 방문"],
  ["annual", "HALF_DAY_AM", "2026-03-13", "2026-03-13", 0.5, "approved", "병원 검진"],
  ["annual", "FULL_DAY", "2026-05-04", "2026-05-06", 2, "approved", "가족 여행"],
  ["sick", "FULL_DAY", "2026-06-17", "2026-06-17", 1, "approved", "감기 몸살"],
  ["reward", "FULL_DAY", "2026-07-03", "2026-07-03", 1, "approved", "상반기 릴리스 포상"],
  ["annual", "FULL_DAY", "2026-08-10", "2026-08-14", 5, "approved", "여름 휴가. 급한 일은 김하늘 님께 넘겼습니다."],
  ["annual", "HALF_DAY_PM", "2026-09-22", "2026-09-22", 0.5, "approved", "이사 준비"],
  ["annual", "FULL_DAY", "2026-10-19", "2026-10-19", 1, "rejected", "개인 일정", "릴리스 주간이라 다음 주로 옮겨 주세요."],
  ["annual", "FULL_DAY", "2026-10-26", "2026-10-26", 1, "approved", "개인 일정(지난주 반려 건을 옮김)"],
  ["annual", "HALF_DAY_PM", "2026-11-06", "2026-11-06", 0.5, "approved", "은행 업무"],
  ["annual", "FULL_DAY", "2026-11-23", "2026-11-24", 2, "pending", "가족 행사"],
  ["annual", "QUARTER_DAY_4", "2026-12-04", "2026-12-04", 0.25, "approved", "아이 하원"],
  ["annual", "FULL_DAY", "2026-12-24", "2026-12-24", 1, "approved", "연말 휴가"],
]

/** 신청은 쉬는 날의 일주일 전에 올렸다. */
const weekBefore = (iso: string) => {
  const day = new Date(`${iso}T09:00:00`)
  day.setDate(day.getDate() - 7)
  return day.toISOString()
}

/** 새 것이 위로(쉬는 날이 늦은 것부터). */
export const mockRequests: LeaveRequest[] = SEEDS.map(([type, slot, startDate, endDate, days, status, reason, note], index) => ({
  id: `leave-${index + 1}`, type, slot, startDate, endDate, days, reason, status, note, approvers: mockLine, requestedAt: weekBefore(startDate),
})).reverse()

/** 0 ≤ n < 1을 날짜에서 정한다(새로 그려도 같은 기록). */
const noise = (day: Date, salt: number) => ((day.getDate() * 37 + day.getMonth() * 101 + salt * 53) % 97) / 97
const time = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`

const OVERTIME_REASONS = ["릴리스 준비", "장애 대응", "고객사 회의 자료 정리", "배포 뒤 모니터링"]

/** 하루 휴가(승인)인 날. 반차 · 반반차인 날도 출퇴근은 남는다. */
const isOnLeave = (iso: string) => mockRequests.some(request => request.status === "approved" && request.slot === "FULL_DAY"
  && request.startDate <= iso && iso <= request.endDate)

/**
 * 9월 1일부터 어제까지 평일의 출퇴근. 출근은 08:50~09:10, 퇴근은 대개 18시 무렵이고 며칠은 늦게까지 남는다.
 * 18시 이후 한 시간 넘게 남은 날은 연장근무(30분 단위, 저녁 30분은 빼고)이며, 지난주까지는 결재가 끝났고 이번 주는 승인 대기다.
 * 공휴일은 공휴일 엔터티를 아는 쪽이 걸러낸다(useAttendance).
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
