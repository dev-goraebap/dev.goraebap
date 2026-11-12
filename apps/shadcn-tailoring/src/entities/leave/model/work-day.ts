import { dayText } from "./text"
import type { LeaveRequest, LeaveSlot, SpecialType } from "./types"

/*
 * 휴가 일수와 고를 수 있는 날(호호코워크 leave-form.ts). 날은 시간대 없는 날짜라 UTC 자정으로 읽고 옮겨 서머타임에
 * 하루가 빠지지 않는다. closed는 공휴일 날짜의 모음으로, 공휴일 엔터티를 읽는 쪽(페이지)이 넘긴다.
 */
const utc = (iso: string) => new Date(`${iso}T00:00:00Z`)

export function addDays(iso: string, days: number): string {
  const date = utc(iso)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** 토 · 일요일과 공휴일: 근무일 기준 휴가가 세지 않고 고를 수도 없는 날. */
export const isClosed = (iso: string, closed: ReadonlySet<string>) => {
  const weekday = utc(iso).getUTCDay()
  return weekday === 0 || weekday === 6 || closed.has(iso)
}

/** 두 날짜 사이(양 끝 포함)의 근무일: 주말과 공휴일을 뺀다. */
export function countWorkdays(start: string, end: string, closed: ReadonlySet<string>) {
  let count = 0
  for (let day = start; day <= end; day = addDays(day, 1)) if (!isClosed(day, closed)) count += 1
  return count
}

/** 하루 중 얼마나 되는지. */
export const slotShare: Record<LeaveSlot, number> = {
  FULL_DAY: 1, HALF_DAY_AM: 0.5, HALF_DAY_PM: 0.5,
  QUARTER_DAY_1: 0.25, QUARTER_DAY_2: 0.25, QUARTER_DAY_3: 0.25, QUARTER_DAY_4: 0.25,
}

/** 신청이 쓰는 일수. 종일이 아니면 그 칸의 몫, 종일이면 근무일 기준은 근무일 수, 달력일 기준은 주말 · 공휴일까지 모든 날. */
export function leaveDays({ slot, start, end, basis = "WORKING_DAY", closed }: {
  slot: LeaveSlot; start: string; end: string; basis?: SpecialType["durationBasis"]; closed: ReadonlySet<string>
}) {
  if (slot !== "FULL_DAY") return slotShare[slot]
  if (basis === "CALENDAR_DAY") return Math.round((utc(end).getTime() - utc(start).getTime()) / 86_400_000) + 1
  return countWorkdays(start, end, closed)
}

/** 하루 중 얼마를 쉬는지의 구분(호호코워크 LeaveKind). 구분마다 고를 칸이 다르다. */
export type LeaveKind = "FULL" | "HALF" | "QUARTER"
export const LEAVE_KINDS: readonly LeaveKind[] = ["FULL", "HALF", "QUARTER"]
export const kindLabels: Record<LeaveKind, string> = { FULL: "하루 이상", HALF: "반차", QUARTER: "반반차" }
export const kindSlots: Record<LeaveKind, readonly LeaveSlot[]> = {
  FULL: ["FULL_DAY"],
  HALF: ["HALF_DAY_AM", "HALF_DAY_PM"],
  QUARTER: ["QUARTER_DAY_1", "QUARTER_DAY_2", "QUARTER_DAY_3", "QUARTER_DAY_4"],
}
export const kindOf = (slot: LeaveSlot): LeaveKind => (slot === "FULL_DAY" ? "FULL" : slot.startsWith("HALF") ? "HALF" : "QUARTER")

/**
 * 근무 시간표(호호코워크 work-schedule)의 칸: 09:00~18:00, 점심 12:00~13:00. 반차는 점심을 오전에 넣어 다섯 시간 · 네 시간,
 * 반반차는 두 시간 안팎(둘째 칸이 점심을 넘는다). 이 앱은 요일마다 같은 시간표를 쓴다.
 */
const SLOT_HOURS: Record<Exclude<LeaveSlot, "FULL_DAY">, { start: string; end: string }> = {
  HALF_DAY_AM: { start: "09:00", end: "14:00" },
  HALF_DAY_PM: { start: "14:00", end: "18:00" },
  QUARTER_DAY_1: { start: "09:00", end: "11:00" },
  QUARTER_DAY_2: { start: "11:00", end: "14:00" },
  QUARTER_DAY_3: { start: "14:00", end: "16:00" },
  QUARTER_DAY_4: { start: "16:00", end: "18:00" },
}
export const slotHours = (slot: LeaveSlot) => (slot === "FULL_DAY" ? undefined : SLOT_HOURS[slot])
/** "09:00 – 14:00". 종일은 없다. */
export const slotRange = (slot: LeaveSlot) => {
  const hours = slotHours(slot)
  return hours && `${hours.start} – ${hours.end}`
}

/** 새 신청이 겹치면 안 되는 내 휴가: 결재 중이거나 승인된 것. */
export const bookingsOf = (requests: readonly LeaveRequest[]) => requests.filter(request => request.status !== "rejected")

const covers = (booking: LeaveRequest, iso: string) => booking.startDate <= iso && iso <= booking.endDate

/**
 * 같은 날 두 휴가가 함께 설 수 있는지(호호코워크 서버의 겹침 규칙): 둘 다 종일이 아니고, 시간이 만나지 않으며,
 * 합쳐 하루를 넘지 않을 때만 된다.
 */
function clashes(slot: LeaveSlot, other: LeaveRequest): boolean {
  const mine = slotHours(slot)
  const theirs = slotHours(other.slot)
  if (!mine || !theirs) return true
  const timesMeet = mine.start < theirs.end && theirs.start < mine.end
  return timesMeet || slotShare[slot] + slotShare[other.slot] > 1
}

export type SlotOption = { slot: LeaveSlot; state: "open" | "taken" }

/** 그날 그 구분의 칸마다 고를 수 있는지(이미 신청한 휴가와 겹치면 taken). */
export function slotOptions(iso: string, kind: LeaveKind, bookings: readonly LeaveRequest[]): SlotOption[] {
  const sameDay = bookings.filter(booking => covers(booking, iso))
  return kindSlots[kind].map(slot => ({ slot, state: sameDay.some(other => clashes(slot, other)) ? "taken" : "open" }))
}

/** 그 구분의 신청이 그날 시작하거나 끝날 수 있는지. 근무일 기준이면 주말 · 공휴일은 안 된다. */
export function dayOpen(iso: string, kind: LeaveKind, bookings: readonly LeaveRequest[], closed: ReadonlySet<string>, countsAllDays = false) {
  if (!countsAllDays && isClosed(iso, closed)) return false
  if (kind === "FULL") return !bookings.some(booking => covers(booking, iso))
  return slotOptions(iso, kind, bookings).some(option => option.state === "open")
}

/** 기간이 이미 신청한 휴가와 겹치는지. */
export const rangeClashes = (start: string, end: string, bookings: readonly LeaveRequest[]) =>
  bookings.some(booking => booking.startDate <= end && start <= booking.endDate)

/** 이번 신청이 쓰는 것과 남는 것, 모자라면 얼마나 모자란지(호호코워크 usageText). 일수를 세기 전에는 글이 없다. */
export function usageText(days: number | undefined, available: number | undefined): { text?: string; isOver: boolean } {
  if (days === undefined) return { isOver: false }
  if (available === undefined) return { text: `${dayText(days)} 사용`, isOver: false }
  if (days > available) return { text: `${dayText(days)} · ${dayText(days - available)} 부족`, isOver: true }
  return { text: `${dayText(days)} · 신청 후 ${dayText(available - days)}`, isOver: false }
}

/** 특별휴가의 조건을 짧은 말로(호호코워크 specialRules). 양식이 이름 아래에 늘어놓는다. */
export function specialRules(type: SpecialType): string[] {
  const rules = [type.durationBasis === "CALENDAR_DAY" ? "주말·공휴일 포함 일수" : "근무일 기준 일수"]
  if (type.maxDays !== undefined) rules.push(`한 번에 ${type.maxDays}일까지`)
  if (type.requiresReason) rules.push("사유 필요")
  return rules
}

/** 특별휴가 카드의 한 줄: 남은 일수, 아니면 어떻게 주어지는지. */
export const specialNote = (type: SpecialType) => (type.available !== undefined ? `남은 ${dayText(type.available)}` : "필요할 때 신청")
