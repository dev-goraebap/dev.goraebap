export type Person = { id: string; name: string }

/** 회의록이 어디까지 만들어졌는지(호호코워크 MEETING_STATUS): 녹음을 받아쓰고 요약해 완료된다. */
export type MeetingStatus = "waiting" | "transcribing" | "summarizing" | "completed" | "failed"

export type MeetingActionItem = { text: string; owner?: Person; /** YYYY-MM-DD */ due?: string }

/** 받아쓴 원문의 한 토막. */
export type TranscriptLine = { startMs: number; speaker: string; text: string }

/**
 * 회의에 붙인 파일(회의 녹음 · 회의 사진). 서버가 없으므로 만들 때 고른 파일을 이 브라우저의 object URL로 들고 있다
 * (새로고침하면 사라진다). 예시 회의록의 파일은 이름과 크기만 있고 url이 없다(받아쓴 뒤 녹음을 지운 호호코워크처럼).
 */
export type MeetingFile = { id: string; name: string; size: number; /** MIME 형식 */ type: string; url?: string }

/** 회의록이 이어진 일정(호호코워크 MeetingDetail.event). */
export type MeetingEvent = { id: string; title: string }

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
  /** 회의 녹음. 받아쓰면 호호코워크는 녹음을 지우고 이름만 남긴다. */
  audio?: MeetingFile
  /** 회의 사진. 요약이 끝나면 호호코워크는 회의록 본문에 넣는다. */
  photos: MeetingFile[]
  event?: MeetingEvent
}

/** 새 회의록 · 회의록 수정 양식이 정하는 것. */
export type MeetingDraft = Pick<Meeting, "title" | "project" | "heldStart" | "heldEnd" | "attendees" | "note">

/** 새 회의록: 양식의 값과 고른 파일(녹음 하나 · 사진 여러 장), 이어 둔 일정. */
export type NewMeeting = MeetingDraft & { audio: File; photos: File[]; event?: MeetingEvent }
