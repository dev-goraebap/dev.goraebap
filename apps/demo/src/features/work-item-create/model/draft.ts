import {
  LABELS, PEOPLE, columnOf, initialColumn, type NewWorkItem, type WorkflowColumn, type WorkItemPriority, type WorkItemStatus, type WorkItemType,
} from "@/entities/work-item"

/**
 * 쓰는 중인 새 업무. 담당자와 라벨은 id로 들고, 만들 때 값으로 바꾼다. 상태는 고른 칸 id이며 비면 첫 할 일 칸이다.
 * 칸은 워크플로를 읽은 뒤에야 알므로 그릴 때와 만들 때 draftColumn으로 칸을 정한다(없는 칸이면 대체 칸).
 */
export type WorkItemDraft = {
  title: string; body: string; type: WorkItemType; status?: WorkItemStatus; priority: WorkItemPriority
  assigneeId?: string; labelIds: string[]; dueDate?: string
}

export const draftColumn = (draft: WorkItemDraft, columns: readonly WorkflowColumn[]) =>
  draft.status ? columnOf(columns, draft.status) : initialColumn(columns)

export const blankDraft = (status?: WorkItemStatus): WorkItemDraft => ({
  title: "", body: "", type: "task", status, priority: "none", labelIds: [],
})

export const isReady = (draft: WorkItemDraft) => draft.title.trim().length > 0

export const toNewWorkItem = (draft: WorkItemDraft, columns: readonly WorkflowColumn[]): NewWorkItem => ({
  title: draft.title.trim(),
  body: draft.body.trim() || undefined,
  type: draft.type,
  status: draftColumn(draft, columns).id,
  priority: draft.priority,
  assignee: PEOPLE.find(person => person.id === draft.assigneeId),
  labels: LABELS.filter(label => draft.labelIds.includes(label.id)),
  dueDate: draft.dueDate,
})
