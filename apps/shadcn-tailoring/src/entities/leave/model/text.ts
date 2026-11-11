import { ClockIcon, HomeIcon, UmbrellaIcon, type Icon } from "@/shared/ui/icon"
import type { HalfDay, LeaveStatus, LeaveType } from "./types"

/** 상태 점의 색: app/styles/index.css의 --mark-* 토큰. */
export type StatusTone = "bg-mark-medium" | "bg-mark-done" | "bg-mark-urgent"

export const LEAVE_TYPES: readonly { value: LeaveType; label: string; icon: Icon; description: string }[] = [
  { value: "annual", label: "연차", icon: UmbrellaIcon, description: "하루 이상 쉽니다. 연차에서 빠집니다." },
  { value: "half", label: "반차", icon: ClockIcon, description: "오전이나 오후 반나절(0.5일)을 쉽니다." },
  { value: "sick", label: "병가", icon: HomeIcon, description: "아파서 쉽니다. 연차에서 빠지지 않습니다." },
]

export const HALF_DAYS: readonly { value: HalfDay; label: string; time: string }[] = [
  { value: "am", label: "오전 반차", time: "09:00 – 14:00" },
  { value: "pm", label: "오후 반차", time: "14:00 – 18:00" },
]

export const LEAVE_STATUSES: readonly { value: LeaveStatus; label: string; tone: StatusTone }[] = [
  { value: "pending", label: "승인 대기", tone: "bg-mark-medium" },
  { value: "approved", label: "승인", tone: "bg-mark-done" },
  { value: "rejected", label: "반려", tone: "bg-mark-urgent" },
]

const find = <T extends { value: string }>(list: readonly T[], value: string) => list.find(each => each.value === value) ?? list[0]
export const leaveTypeMark = (type: LeaveType) => find(LEAVE_TYPES, type)
export const halfDayMark = (half: HalfDay) => find(HALF_DAYS, half)
export const leaveStatusMark = (status: LeaveStatus) => find(LEAVE_STATUSES, status)

/** 1.5 → "1.5", 2 → "2". */
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

/** 두 날짜 사이(양 끝 포함)의 근무일(월~금). 공휴일은 세지 않는다(목 데이터에 공휴일이 없다). */
export function countWorkdays(start: string, end: string) {
  let count = 0
  for (const day = asDate(start); day <= asDate(end); day.setDate(day.getDate() + 1)) {
    if (day.getDay() !== 0 && day.getDay() !== 6) count += 1
  }
  return count
}

/** 신청이 쓰는 일수: 반차 0.5, 그 밖에는 근무일 수. */
export const leaveDays = (type: LeaveType, start: string, end: string) => (type === "half" ? 0.5 : countWorkdays(start, end))
