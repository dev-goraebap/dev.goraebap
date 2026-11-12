import { CalendarIcon, ChartNoAxesColumnIcon, ListChecksIcon, PenSquareIcon, SquareCheckIcon, TagIcon, UserIcon, type Icon } from "@/shared/ui/icon"
import { formatWorkItemDate } from "./format"
import { priorityMark, typeMark } from "./marks"
import type { WorkItem, WorkItemActivity, WorkItemField, WorkItemPatch } from "./types"
import { columnOf, type WorkflowColumn } from "./workflow"

type Change = Extract<WorkItemActivity, { kind: "changed" }>

/** 속성 값을 활동이 읽는 글자로. 비면 undefined. 상태는 프로젝트의 칸 이름이다. */
const shownWith = (columns: readonly WorkflowColumn[]): { [Field in WorkItemField]: (value: WorkItem[Field]) => string | undefined } => ({
  status: value => value && columnOf(columns, value).name,
  priority: value => value && priorityMark(value).label,
  type: value => value && typeMark(value).label,
  assignee: value => value?.name,
  labels: value => (value?.length ? value.map(label => label.name).join(", ") : undefined),
  dueDate: value => value && formatWorkItemDate(value),
})

/**
 * 바꾼 속성마다 활동 한 줄의 내용(바꾸기 전후). 값이 같으면 남기지 않는다. 글자로 남기므로 칸 이름을 나중에 바꿔도
 * 지난 활동은 그때의 이름 그대로다.
 */
export function changesOf(item: WorkItem, patch: WorkItemPatch, columns: readonly WorkflowColumn[]): Pick<Change, "field" | "before" | "after">[] {
  const shown = shownWith(columns)
  return (Object.keys(patch) as WorkItemField[]).flatMap(field => {
    const show = shown[field] as (value: unknown) => string | undefined
    const before = show(item[field])
    const after = show(patch[field])
    return before === after ? [] : [{ field, before, after }]
  })
}

/** 활동 한 줄이 행위자 이름 뒤에 하는 말(호호코워크 activityText). */
export function activityText(entry: WorkItemActivity): string {
  if (entry.kind === "created") return "업무를 만들었습니다"
  if (entry.kind === "comment") return "댓글을 남겼습니다"
  const { before = "없음", after } = entry
  switch (entry.field) {
    case "status": return `상태를 ${before}에서 ${after ?? "없음"}(으)로 옮겼습니다`
    case "priority": return `우선순위를 ${before}에서 ${after ?? "없음"}(으)로 바꿨습니다`
    case "type": return `유형을 ${before}에서 ${after ?? "없음"}(으)로 바꿨습니다`
    case "assignee": return after ? `담당자를 ${after}님으로 정했습니다` : "담당자를 뺐습니다"
    case "labels": return after ? `라벨을 ${after}(으)로 바꿨습니다` : "라벨을 모두 뺐습니다"
    case "dueDate": return after ? `마감일을 ${after}(으)로 바꿨습니다` : "마감일을 비웠습니다"
  }
}

const FIELD_ICONS: Record<WorkItemField, Icon> = {
  status: SquareCheckIcon, priority: ChartNoAxesColumnIcon, type: ListChecksIcon, assignee: UserIcon, labels: TagIcon, dueDate: CalendarIcon,
}

/** 활동 선 위의 표식: 무엇을 바꿨는지(속성 알약과 같은 아이콘). */
export const activityIcon = (entry: WorkItemActivity): Icon => (entry.kind === "changed" ? FIELD_ICONS[entry.field] : PenSquareIcon)
