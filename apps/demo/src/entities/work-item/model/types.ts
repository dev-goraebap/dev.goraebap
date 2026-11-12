/** 업무가 놓인 보드 칸의 id. 칸(이름 · 분류 · 순서)은 프로젝트의 워크플로(workflow.ts)가 정한다. */
export type WorkItemStatus = string
/** 가장 급한 것부터, 마지막이 없음. */
export type WorkItemPriority = "urgent" | "high" | "medium" | "low" | "none"
export type WorkItemType = "task" | "feature" | "bug" | "epic"

/** 라벨 색은 사용자 데이터다. 저장된 hex를 그대로 그린다(LABEL_COLORS). */
export type WorkItemLabel = { id: string; name: string; color: string }
export type Person = { id: string; name: string }

export type WorkItem = {
  id: string
  /** 프로젝트 키와 번호: cowork-14 */
  key: string
  number: number
  title: string
  /** 본문(Markdown). */
  body?: string
  status: WorkItemStatus
  priority: WorkItemPriority
  type: WorkItemType
  labels: WorkItemLabel[]
  assignee?: Person
  /** YYYY-MM-DD */
  dueDate?: string
  /** ISO 시각 */
  updatedAt: string
}

export type NewWorkItem = Pick<WorkItem, "title" | "body" | "status" | "priority" | "type" | "labels" | "assignee" | "dueDate">

/** 상세에서 바꾸는 속성. */
export type WorkItemPatch = Partial<Pick<WorkItem, "status" | "priority" | "type" | "assignee" | "labels" | "dueDate">>
export type WorkItemField = keyof WorkItemPatch

/** 업무 활동의 한 칸: 만듦 · 속성 바꿈(바꾸기 전후를 읽는 글자로) · 댓글. */
export type WorkItemActivity = { id: string; at: string; actor: Person } & (
  | { kind: "created" }
  | { kind: "changed"; field: WorkItemField; before?: string; after?: string }
  | { kind: "comment"; body: string }
)
