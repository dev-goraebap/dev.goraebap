/** 보드 칸의 흐름 순서. 칸 이름은 marks.ts의 STATUSES가 정한다. */
export type WorkItemStatus = "backlog" | "todo" | "in_progress" | "done"
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
