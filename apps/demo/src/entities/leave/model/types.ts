/** 하루 중 얼마를 쉬는지(호호코워크 LeaveSlot). 종일, 반차(오전 · 오후 0.5일), 반반차(네 칸 중 하나, 0.25일). */
export type LeaveSlot =
  | "FULL_DAY" | "HALF_DAY_AM" | "HALF_DAY_PM"
  | "QUARTER_DAY_1" | "QUARTER_DAY_2" | "QUARTER_DAY_3" | "QUARTER_DAY_4"

/** 특별휴가의 종류. 연차가 아닌 휴가는 모두 이 목록에서 고른다. */
export type SpecialTypeId = "reward" | "substitute" | "sick" | "family"
/** 휴가의 종류: 연차 또는 특별휴가 하나. */
export type LeaveType = "annual" | SpecialTypeId

/** 결재 상태: 승인 대기 · 승인 · 반려. */
export type LeaveStatus = "pending" | "approved" | "rejected"

/** 결재선의 한 사람. 차례는 배열 순서다. */
export type Approver = { id: string; name: string }

export type LeaveRequest = {
  id: string
  type: LeaveType
  slot: LeaveSlot
  /** YYYY-MM-DD. 종일이 아니면 시작일과 같다. */
  startDate: string
  endDate: string
  /** 쓰는 일수(근무일 기준이면 주말 · 공휴일을 뺀다, 반차 0.5, 반반차 0.25). */
  days: number
  reason?: string
  status: LeaveStatus
  /** ISO 시각 */
  requestedAt: string
  /** 결재할(한) 사람들, 1차부터. 비면 결재 없이 승인된 것이다. */
  approvers: Approver[]
  /** 반려 사유. */
  note?: string
}

/** 새 신청. 일수는 신청 양식이 공휴일까지 빼고 센 값을 보낸다(호호코워크는 서버가 센다). */
export type NewLeaveRequest = Pick<LeaveRequest, "type" | "slot" | "startDate" | "endDate" | "days" | "reason" | "approvers">

/**
 * 특별휴가 하나(호호코워크 SpecialType). 근무일 기준이면 주말 · 공휴일을 빼고, 달력일 기준이면 모두 센다.
 * granted가 있으면 회사가 미리 준 일수에서 빠지고, 없으면 일이 생길 때마다 쓴다.
 */
export type SpecialType = {
  id: SpecialTypeId
  name: string
  description: string
  durationBasis: "WORKING_DAY" | "CALENDAR_DAY"
  /** 미리 받은 일수. */
  granted?: number
  /** 남은 일수(granted - 사용 - 결재 중). granted가 없으면 없다. */
  available?: number
  /** 한 번에 쓸 수 있는 일수. */
  maxDays?: number
  requiresReason: boolean
}

/** 올해 연차: 부여 · 사용 · 결재 중 · 신청 가능(부여 - 사용 - 결재 중), 소멸 예정과 다음 부여. */
export type LeaveSummary = {
  granted: number
  used: number
  pending: number
  /** 잔여: 부여 - 사용. */
  remaining: number
  /** 새로 신청할 수 있는 일수: 잔여 - 결재 중. */
  available: number
  expiringDays: number
  /** YYYY-MM-DD */
  expiringDate: string
  nextGrantDays: number
  nextGrantDate: string
}

/** 월별 휴가 사용: 이미 쓴 연차 · 그 외(특별휴가), 승인됐지만 아직 오지 않은 날(예정). */
export type MonthUsage = { month: number; annual: number; other: number; scheduled: number; total: number }

/** 하루의 출퇴근 기록과 그날의 연장근무(18시 이후, 있으면 결재 상태). */
export type AttendanceDay = {
  /** YYYY-MM-DD */
  date: string
  /** HH:MM */
  clockIn: string
  clockOut: string
  /** 인정된 연장근무(분). 0이면 연장근무 없음. */
  overtimeMinutes: number
  /** 연장근무의 결재 상태와 사유. */
  overtimeStatus?: LeaveStatus
  overtimeReason?: string
}
