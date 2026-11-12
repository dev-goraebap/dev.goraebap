import type { ReportState, WeeklyReport } from "./types"

/** 상태마다 화면 어디서나 같은 이름과 점 색(업무 표식 토큰). */
export const REPORT_STATES: readonly { value: ReportState; label: string; dot: string }[] = [
  { value: "none", label: "작성 전", dot: "bg-mark-backlog" },
  { value: "draft", label: "작성 중", dot: "bg-mark-low" },
  { value: "submitted", label: "제출", dot: "bg-mark-done" },
  { value: "confirmed", label: "확인", dot: "bg-mark-done" },
]
export const reportState = (state: ReportState) => REPORT_STATES.find(each => each.value === state) ?? REPORT_STATES[0]

/** 들어온 보고(제출 · 확인)라 읽을 수 있는지. */
export const isSubmitted = (state: ReportState) => state === "submitted" || state === "confirmed"

/** 목록 줄에 보일 한 줄 요약: 금주 실적의 첫 내용 줄에서 목록 표시와 굵게 표시를 뺀 것. */
export function summaryOf(report: Pick<WeeklyReport, "thisWeek">): string {
  const line = report.thisWeek.split("\n").map(text => text.trim()).find(text => text && !text.startsWith("#"))
  return (line ?? "").replace(/^(?:[-*]|\d+\.)\s+/, "").replace(/\*\*/g, "").replace(/`/g, "")
}
