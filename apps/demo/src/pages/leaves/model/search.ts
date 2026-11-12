import { currentMonth } from "@/entities/leave"
import { paths } from "@/shared/config"

/** 근태 · 휴가의 탭. 주소에 남겨(?tab=overtime&month=2026-10) 새로고침 · 링크로 같은 화면이 열린다. */
export type LeavesTab = "leave" | "overtime"
export type LeavesSearch = { tab: LeavesTab; month: string }

const isMonth = (raw: unknown): raw is string => typeof raw === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(raw)

/** 탭이 없으면 휴가, 달은 연장근무 탭에서만 이번 달이 아닐 때 주소에 둔다. */
export function parseLeavesSearch(raw: Record<string, unknown>): LeavesSearch {
  return { tab: raw.tab === "overtime" ? "overtime" : "leave", month: isMonth(raw.month) ? raw.month : currentMonth() }
}

export function leavesSearch({ tab, month }: LeavesSearch): Record<string, string> {
  if (tab === "leave") return {}
  return month === currentMonth() ? { tab } : { tab, month }
}

export const NEW_LEAVE_PATH = `${paths.leaves}/new`
