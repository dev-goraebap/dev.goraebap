import { LABELS, PEOPLE, type NewWorkItem, type WorkItemPriority, type WorkItemStatus, type WorkItemType } from "@/entities/work-item"

/** 쓰는 중인 새 업무. 담당자와 라벨은 id로 들고, 만들 때 값으로 바꾼다. */
export type WorkItemDraft = {
  title: string; body: string; type: WorkItemType; status: WorkItemStatus; priority: WorkItemPriority
  assigneeId?: string; labelIds: string[]; dueDate?: string
}

export const blankDraft = (status: WorkItemStatus = "todo"): WorkItemDraft => ({
  title: "", body: "", type: "task", status, priority: "none", labelIds: [],
})

export const isReady = (draft: WorkItemDraft) => draft.title.trim().length > 0

export const toNewWorkItem = (draft: WorkItemDraft): NewWorkItem => ({
  title: draft.title.trim(),
  body: draft.body.trim() || undefined,
  type: draft.type,
  status: draft.status,
  priority: draft.priority,
  assignee: PEOPLE.find(person => person.id === draft.assigneeId),
  labels: LABELS.filter(label => draft.labelIds.includes(label.id)),
  dueDate: draft.dueDate,
})
