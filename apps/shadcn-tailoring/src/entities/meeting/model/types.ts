export type Person = { id: string; name: string }

/** 회의록이 어디까지 만들어졌는지(호호코워크 MEETING_STATUS): 녹음을 받아쓰고 요약해 완료된다. */
export type MeetingStatus = "waiting" | "transcribing" | "summarizing" | "completed" | "failed"

export type MeetingActionItem = { text: string; owner?: Person; /** YYYY-MM-DD */ due?: string }

/** 받아쓴 원문의 한 토막. */
export type TranscriptLine = { startMs: number; speaker: string; text: string }

/**
 * 회의 녹음으로 만든 회의록(호호코워크 MeetingDetail). 요약 · 안건 · 결정 사항 · 할 일이 회의록 본문이 되고,
 * 받아쓴 원문은 따로 둔다. 만드는 중이거나 실패했으면 본문이 비어 있다.
 */
export type Meeting = {
  id: string
  title: string
  status: MeetingStatus
  project?: string
  author: Person
  /** ISO 시각 */
  createdAt: string
  heldStart: string
  heldEnd: string
  attendees: Person[]
  agenda: string[]
  decisions: string[]
  actionItems: MeetingActionItem[]
  /** 요약(Markdown). */
  summary: string
  /** 만들 때 남긴 참고 메모. */
  note?: string
  transcript: TranscriptLine[]
  /** 실패했을 때의 까닭. */
  failure?: string
}

/** 새 회의록 · 회의록 수정 양식이 정하는 것. */
export type MeetingDraft = Pick<Meeting, "title" | "project" | "heldStart" | "heldEnd" | "attendees" | "note">
