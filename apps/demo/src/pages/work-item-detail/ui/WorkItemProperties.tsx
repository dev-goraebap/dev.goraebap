import {
  LABELS, ME, PEOPLE, PRIORITIES, TYPES, PersonAvatar, WorkItemLabelDot, WorkItemPriorityIcon, WorkflowColumnIcon, columnOf, formatWorkItemDate,
  type WorkflowColumn, type WorkItem, type WorkItemPatch,
} from "@/entities/work-item"
import { ChartNoAxesColumnIcon, ListChecksIcon, SquareCheckIcon, TagIcon, UserIcon } from "@/shared/ui/icon"
import { DatePill, OptionPill } from "@/shared/ui/property-pill"
import type { DetailSection } from "@/shared/ui/reading"

const priorityOptions = PRIORITIES.map(priority => ({ value: priority.value, label: priority.label, icon: <WorkItemPriorityIcon priority={priority.value} /> }))
const typeOptions = TYPES.map(type => ({ value: type.value, label: type.label, icon: <type.icon /> }))
const personOptions = PEOPLE.map(person => ({
  value: person.id, label: person.id === ME.id ? `${person.name} (나)` : person.name, icon: <PersonAvatar person={person} className="size-4" />,
}))
const labelOptions = LABELS.map(label => ({ value: label.id, label: label.name, icon: <WorkItemLabelDot color={label.color} /> }))

/**
 * 업무 상세의 속성 묶음(호호코워크 WorkItemProperties): 속성(상태 · 우선순위 · 유형 · 담당자 · 마감일)과 라벨.
 * 알약마다 고르면 바로 바뀐다. 같은 담당자를 다시 고르면 뺀다. 상태는 프로젝트의 칸(columns)에서 고르고,
 * 지워진 칸에 있던 업무는 대체 칸을 보인다.
 */
export function workItemSections(item: WorkItem, columns: readonly WorkflowColumn[], onChange: (patch: WorkItemPatch) => void): DetailSection[] {
  const statusOptions = columns.map(column => ({ value: column.id, label: column.name, icon: <WorkflowColumnIcon column={column} /> }))
  return [
    {
      title: "속성",
      items: (
        <>
          <OptionPill label="상태" icon={SquareCheckIcon} value={columnOf(columns, item.status).id} options={statusOptions} onChange={status => onChange({ status })} />
          <OptionPill label="우선순위" icon={ChartNoAxesColumnIcon} value={item.priority === "none" ? undefined : item.priority} options={priorityOptions}
            onChange={priority => onChange({ priority })} />
          <OptionPill label="유형" icon={ListChecksIcon} showLabel value={item.type} options={typeOptions} onChange={type => onChange({ type })} />
          <OptionPill label="담당자" icon={UserIcon} emptyText="담당자 없음" value={item.assignee?.id} options={personOptions}
            onChange={id => onChange({ assignee: id === item.assignee?.id ? undefined : PEOPLE.find(person => person.id === id) })} />
          <DatePill label="마감일" value={item.dueDate} format={formatWorkItemDate} onChange={dueDate => onChange({ dueDate })} />
        </>
      ),
    },
    {
      title: "라벨",
      items: (
        <OptionPill label="라벨" icon={TagIcon} emptyText="라벨 더하기" isMultiple value={item.labels.map(label => label.id)} options={labelOptions}
          onChange={ids => onChange({ labels: LABELS.filter(label => ids.includes(label.id)) })} />
      ),
    },
  ]
}
