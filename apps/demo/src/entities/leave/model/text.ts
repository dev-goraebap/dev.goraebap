import type { LeaveRequest, LeaveSlot, LeaveStatus, SpecialType } from "./types"

/** 상태 점의 색: app/styles/index.css의 --mark-* 토큰. */
export type StatusTone = "bg-mark-medium" | "bg-mark-done" | "bg-mark-urgent"

/** 쉬는 칸의 이름(호호코워크 slotLabels). */
export const slotLabels: Record<LeaveSlot, string> = {
  FULL_DAY: "종일", HALF_DAY_AM: "오전 반차", HALF_DAY_PM: "오후 반차",
  QUARTER_DAY_1: "반반차 1", QUARTER_DAY_2: "반반차 2", QUARTER_DAY_3: "반반차 3", QUARTER_DAY_4: "반반차 4",
}

export const LEAVE_STATUSES: readonly { value: LeaveStatus; label: string; tone: StatusTone }[] = [
  { value: "pending", label: "승인 대기", tone: "bg-mark-medium" },
  { value: "approved", label: "승인", tone: "bg-mark-done" },
  { value: "rejected", label: "반려", tone: "bg-mark-urgent" },
]

/** 신청 줄의 이름: 연차는 칸에 따라 연차 · 오전 반차 · 반반차 1, 특별휴가는 그 이름(종일이 아니면 칸을 붙인다). */
export function leaveTitle(request: Pick<LeaveRequest, "type" | "slot">, types: readonly SpecialType[] = []) {
  if (request.type === "annual") return request.slot === "FULL_DAY" ? "연차" : slotLabels[request.slot]
  const name = types.find(type => type.id === request.type)?.name ?? "특별휴가"
  return request.slot === "FULL_DAY" ? name : `${name} · ${slotLabels[request.slot]}`
}

export const leaveStatusMark = (status: LeaveStatus) => LEAVE_STATUSES.find(each => each.value === status) ?? LEAVE_STATUSES[0]

/** 1.5 → "1.5", 0.25 → "0.25", 2 → "2". */
export const formatDays = (value: number) => (Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100))
/** 1.5 → "1.5일". */
export const dayText = (days: number) => `${formatDays(days)}일`

/** 210 → "3시간 30분", 45 → "45분". */
export function durationText(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest}분`
  return rest === 0 ? `${hours}시간` : `${hours}시간 ${rest}분`
}

const asDate = (iso: string) => new Date(`${iso}T00:00:00`)
const weekday = (iso: string) => new Intl.DateTimeFormat("ko-KR", { weekday: "short" }).format(asDate(iso))

/** 2026-11-10 → "11월 10일(화)". */
export const dateText = (iso: string) => `${Number(iso.slice(5, 7))}월 ${Number(iso.slice(8))}일(${weekday(iso)})`
/** 하루면 그날, 여러 날이면 "11월 20일(금) ~ 11월 24일(화)". */
export const periodText = (start: string, end: string) => (start === end ? dateText(start) : `${dateText(start)} ~ ${dateText(end)}`)
/** 2027-01-02 → "2027.1.2". */
export const shortDateText = (iso: string) => `${Number(iso.slice(0, 4))}.${Number(iso.slice(5, 7))}.${Number(iso.slice(8))}`

const pad = (value: number) => String(value).padStart(2, "0")
export const isoOf = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
export const todayIso = () => isoOf(new Date())

/** 이번 달 2026-11. */
export const currentMonth = () => todayIso().slice(0, 7)
export function shiftMonth(month: string, by: number) {
  const date = new Date(Number(month.slice(0, 4)), Number(month.slice(5)) - 1 + by, 1)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}
export const monthTitle = (month: string) => `${month.slice(0, 4)}년 ${Number(month.slice(5))}월`
