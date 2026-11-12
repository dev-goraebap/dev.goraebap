import type { Meeting, MeetingStatus } from "./types"

/** 상태 이름과 표식 색(text-mark-*). */
export const MEETING_STATUSES: readonly { value: MeetingStatus; label: string; tone: string }[] = [
  { value: "waiting", label: "대기 중", tone: "text-mark-backlog" },
  { value: "transcribing", label: "받아쓰는 중", tone: "text-mark-low" },
  { value: "summarizing", label: "회의록 작성 중", tone: "text-mark-low" },
  { value: "completed", label: "완료", tone: "text-mark-done" },
  { value: "failed", label: "실패", tone: "text-mark-urgent" },
]
export const statusMark = (status: MeetingStatus) => MEETING_STATUSES.find(each => each.value === status) ?? MEETING_STATUSES[0]

/** 아직 만드는 중인지. */
export const isInProgress = (status: MeetingStatus) => status === "waiting" || status === "transcribing" || status === "summarizing"

/** 목록의 상태 필터(호호코워크 progress): 만드는 중 · 완료 · 실패. */
export const PROGRESS = [
  { value: "in_progress", label: "만드는 중" },
  { value: "completed", label: "완료" },
  { value: "failed", label: "실패" },
] as const
export type MeetingProgress = (typeof PROGRESS)[number]["value"]
export const progressOf = (status: MeetingStatus): MeetingProgress => (isInProgress(status) ? "in_progress" : status === "failed" ? "failed" : "completed")

const zone = { timeZone: "Asia/Seoul" } as const
const dayParts = new Intl.DateTimeFormat("ko-KR", { ...zone, year: "numeric", month: "numeric", day: "numeric", weekday: "short" })
const clock = new Intl.DateTimeFormat("ko-KR", { ...zone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
const stampParts = new Intl.DateTimeFormat("en-CA", { ...zone, year: "numeric", month: "2-digit", day: "2-digit" })

const dayText = (date: Date) => {
  const part = Object.fromEntries(dayParts.formatToParts(date).map(each => [each.type, each.value]))
  return `${part.year}년 ${part.month}월 ${part.day}일 (${part.weekday})`
}

/** 상세의 회의 일시: 2026년 11월 10일 (화) 10:00 – 11:00. */
export const heldText = (meeting: Pick<Meeting, "heldStart" | "heldEnd">) =>
  `${dayText(new Date(meeting.heldStart))} ${clock.format(new Date(meeting.heldStart))} – ${clock.format(new Date(meeting.heldEnd))}`

/** 목록의 회의 일시(호호코워크 rowHeldText): 2026-11-10 10:00. */
export const rowHeldText = (meeting: Pick<Meeting, "heldStart">) =>
  `${stampParts.format(new Date(meeting.heldStart))} ${clock.format(new Date(meeting.heldStart))}`

const due = (date: string) => `${Number(date.slice(5, 7))}월 ${Number(date.slice(8, 10))}일까지`

/**
 * 회의록 본문(Markdown): 요약 다음에 안건 · 결정 사항 · 할 일. 할 일에는 담당과 기한을 붙인다. 비어 있는 묶음은 뺀다.
 */
export function minutesMarkdown(meeting: Pick<Meeting, "summary" | "agenda" | "decisions" | "actionItems">) {
  const part = (title: string, lines: string[]) => (lines.length > 0 ? `## ${title}\n${lines.map(line => `- ${line}`).join("\n")}` : "")
  const actions = meeting.actionItems.map(item =>
    [item.text, item.owner && `**${item.owner.name}**`, item.due && due(item.due)].filter(Boolean).join(" · "))
  return [meeting.summary, part("안건", meeting.agenda), part("결정 사항", meeting.decisions), part("할 일", actions)]
    .filter(Boolean).join("\n\n")
}

/** 받아쓴 원문의 때: 83,000ms → 1:23. */
export function clockText(ms: number) {
  const seconds = Math.floor(ms / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
}

/** 파일 크기: 1.2 MB, 340 KB. */
export function sizeText(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}
