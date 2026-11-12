/** 보고를 쓰는 팀원. */
export type ReportMember = { id: string; name: string; department: string }

/** 한 주 보고의 상태: 작성 전(none) · 작성 중(draft, 쓴 사람만 봄) · 제출 · 부서장 확인. */
export type ReportState = "none" | "draft" | "submitted" | "confirmed"

/** 세 단계(금주 실적 · 차주 계획 · 비고)의 Markdown. */
export type ReportParts = { thisWeek: string; nextWeek: string; note: string }

/** 한 사람의 한 주 보고. 아직 쓰지 않은 주도 state "none"인 보고로 둔다. */
export type WeeklyReport = ReportParts & {
  /** `${weekStart}-${author.id}`(reportIdOf). 주소 /weekly-reports/{id}에 그대로 쓴다. */
  id: string
  /** 그 주의 월요일(YYYY-MM-DD). */
  weekStart: string
  author: ReportMember
  isMine: boolean
  state: ReportState
  /** ISO 시각. */
  submittedAt?: string
  confirmedAt?: string
  confirmedBy?: string
}

/** 내 보고를 저장할 때 넘기는 것: 제출하지 않으면 임시 저장이다. */
export type SaveWeeklyReport = ReportParts & { weekStart: string; submit: boolean }
