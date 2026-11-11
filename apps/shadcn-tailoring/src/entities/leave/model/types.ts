/** 휴가 종류. 반차는 오전 · 오후 중 하나로 반나절(0.5일)이다. 연차와 반차는 연차에서 빠지고, 병가는 따로 센다. */
export type LeaveType = "annual" | "half" | "sick"
export type HalfDay = "am" | "pm"
/** 결재 상태: 승인 대기 · 승인 · 반려. */
export type LeaveStatus = "pending" | "approved" | "rejected"

export type LeaveRequest = {
  id: string
  type: LeaveType
  /** 반차일 때만. */
  half?: HalfDay
  /** YYYY-MM-DD. 반차는 시작일과 같다. */
  startDate: string
  endDate: string
  /** 쓰는 일수(근무일 기준, 반차 0.5). */
  days: number
  reason?: string
  status: LeaveStatus
  /** ISO 시각 */
  requestedAt: string
  /** 결재한 사람(승인 대기면 결재할 사람). */
  approver: string
  /** 반려 사유. */
  note?: string
}

export type NewLeaveRequest = Pick<LeaveRequest, "type" | "half" | "startDate" | "endDate" | "reason">

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

/** 월별 휴가 사용: 이미 쓴 연차 · 그 외(병가), 승인됐지만 아직 오지 않은 날(예정). */
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
