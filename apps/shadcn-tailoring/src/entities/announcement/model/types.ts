export type Person = { id: string; name: string }

export type AnnouncementCategory = "general" | "hr" | "welfare" | "system" | "event"

/**
 * 공지에 붙은 파일. 사진이면 isImage. size는 바이트. 서버가 없으므로 이 브라우저에서 붙인 파일은 object URL(url)로 들고 있고
 * (새로고침하면 사라진다), 예시 공지의 파일은 이름과 크기만 있다.
 */
export type AnnouncementFile = { id: string; name: string; size: number; isImage: boolean; url?: string }

/**
 * 모든 구성원에게 내는 공지(호호코워크 AnnouncementDetail). 쓰면 바로 게시된다(임시 저장 없음).
 * isPinned는 목록 맨 위 고정, isImportant는 접속하면 알리는 중요 공지(호호코워크의 팝업)다.
 */
export type Announcement = {
  id: string
  title: string
  category: AnnouncementCategory
  isPinned: boolean
  isImportant: boolean
  author: Person
  /** ISO 시각 */
  publishedAt: string
  updatedAt: string
  readCount: number
  /** "나"가 읽었는지. 상세를 열면 읽음이 된다. */
  isRead: boolean
  /** Markdown */
  body: string
  attachments: AnnouncementFile[]
}

/** 새 공지 · 공지 수정 양식이 정하는 것. */
export type AnnouncementDraft = Pick<Announcement, "title" | "body" | "category" | "isPinned" | "isImportant">

/** 새 공지: 양식의 값과 붙일 파일. */
export type NewAnnouncement = AnnouncementDraft & { files: File[] }

/** 공지 수정: 양식의 값, 새로 붙일 파일, 뺄 첨부의 아이디. */
export type AnnouncementEdit = { id: string; draft: AnnouncementDraft; add: File[]; remove: string[] }
