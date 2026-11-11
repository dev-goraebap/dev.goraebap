/** 알림이 가리키는 것: 결재 요청 · 공지 · 일정 · 업무 멘션. */
export type NotificationKind = "approval" | "notice" | "event" | "mention"

type NotificationBase = {
  id: string
  title: string
  /** 목록 줄의 둘째 줄(무엇에 대한 알림인지 한 줄로). */
  meta: string
  /** 받은 때를 보이는 그대로(오전 9:41, 어제, 11월 6일). */
  receivedAt: string
  isUnread: boolean
}

export type ApprovalDecision = "approved" | "rejected"

export type ApprovalNotification = NotificationBase & {
  kind: "approval"
  requester: string
  team: string
  period: string
  reason: string
  /** 내가 결재를 마쳤으면 그 결과. 없으면 내 결재 차례다. */
  decision?: ApprovalDecision
}

export type NoticeNotification = NotificationBase & {
  kind: "notice"
  author: string
  postedAt: string
  body: string[]
}

export type EventNotification = NotificationBase & {
  kind: "event"
  date: string
  hours: string
  place: string
}

export type MentionNotification = NotificationBase & {
  kind: "mention"
  /** 업무 키(HOH-128). */
  key: string
  workTitle: string
  author: string
  comment: string
}

export type Notification = ApprovalNotification | NoticeNotification | EventNotification | MentionNotification

/** 알림함 목록의 묶음. 결재를 기다리는 결재 요청만 "내 결재 차례"이고 나머지는 "최근 소식"이다. */
export type NotificationGroup = "my-turn" | "recent"

export const notificationGroups: { value: NotificationGroup; label: string }[] = [
  { value: "my-turn", label: "내 결재 차례" },
  { value: "recent", label: "최근 소식" },
]

export const groupOf = (item: Notification): NotificationGroup =>
  item.kind === "approval" && !item.decision ? "my-turn" : "recent"

/** 알림 종류의 이름. 상세 머리 줄과 메뉴에 쓴다(업무 멘션은 머리 줄에 업무 키를 쓴다). */
export const kindLabel: Record<NotificationKind, string> = {
  approval: "결재",
  notice: "공지",
  event: "일정",
  mention: "업무",
}

export const decisionLabel: Record<ApprovalDecision, string> = { approved: "승인함", rejected: "반려함" }
