import { useState } from "react"
import {
  LABELS, PEOPLE, PRIORITIES, TYPES, PersonAvatar, WorkItemLabelDot, WorkItemPriorityIcon, WorkflowColumnIcon,
  columnOf, formatWorkItemDate, typeMark, useCreateWorkItem, useStatusColumns, type WorkItem, type WorkItemStatus,
} from "@/entities/work-item"
import { useProject } from "@/entities/project"
import { paths, projectPath } from "@/shared/config"
import { ComposeFields, ComposeSurface, PlaceChip } from "@/shared/ui/compose"
import { ChartNoAxesColumnIcon, ListChecksIcon, ProjectsIcon, SquareCheckIcon, TagIcon, UserIcon } from "@/shared/ui/icon"
import { DatePill, OptionPill } from "@/shared/ui/property-pill"
import { toast } from "@/shared/ui/toast"
import { blankDraft, draftColumn, isReady, toNewWorkItem, type WorkItemDraft } from "../model/draft"

/**
 * 새 업무(호호코워크 NewWorkItem): 제목과 본문을 종이 위에 쓰고, 유형 · 상태 · 우선순위 · 담당자 · 라벨 · 기한을 알약으로 고른다.
 * 목록 위 대화상자나 자기 페이지(ComposeSurface)에 놓인다. 만들면 알리고 onCreated로 넘긴다. 계속 만들기를 켜면
 * 제목과 본문만 비우고 속성은 남긴 채 열어 둔다. projectKey는 업무를 둘 프로젝트(주소의 소문자 키)이며 상태 알약은 그 프로젝트의 칸을 보인다.
 * status는 처음 고를 칸 id(비면 첫 할 일 칸)이며 바꾸려면 key로 새로 그린다.
 */
export function WorkItemCompose({ projectKey, surface, status, onClose, onExpand, onCreated }: {
  projectKey: string
  surface: "dialog" | "page"
  status?: WorkItemStatus
  onClose: () => void
  onExpand?: () => void
  onCreated: (item: WorkItem) => void
}) {
  const create = useCreateWorkItem(projectKey)
  const columns = useStatusColumns(projectKey)
  const projectName = useProject(projectKey).data?.name ?? projectKey
  const crumbs = [{ label: "프로젝트", href: paths.projects }, { label: projectName, icon: ProjectsIcon, href: projectPath(projectKey) }, { label: "새 업무" }]
  const [draft, setDraft] = useState(() => blankDraft(status))
  const [isContinuing, setContinuing] = useState(false)
  const set = (patch: Partial<WorkItemDraft>) => setDraft(current => ({ ...current, ...patch }))
  const submit = () => create.mutate(toNewWorkItem(draft, columns), {
    onSuccess: item => {
      toast.add({ type: "success", title: `${item.key}를 만들었습니다`, description: `${columnOf(columns, item.status).name} · ${typeMark(item.type).label} · ${item.title}` })
      if (isContinuing) set({ title: "", body: "" })
      else onCreated(item)
    },
  })
  return (
    <ComposeSurface surface={surface} crumbs={crumbs} chip={<PlaceChip icon={<ProjectsIcon />} label={projectName} />}
      isContinuing={isContinuing} onContinuing={setContinuing} onClose={onClose} onExpand={onExpand}
      submit={{ label: "만들기", onSubmit: submit, isDisabled: !isReady(draft), isPending: create.isPending }}
      pills={<>
        <OptionPill label="유형" icon={ListChecksIcon} value={draft.type} onChange={type => set({ type })}
          options={TYPES.map(type => ({ value: type.value, label: type.label, icon: <type.icon /> }))} />
        <OptionPill label="상태" icon={SquareCheckIcon} value={draftColumn(draft, columns).id} onChange={status => set({ status })}
          options={columns.map(column => ({ value: column.id, label: column.name, icon: <WorkflowColumnIcon column={column} /> }))} />
        <OptionPill label="우선순위" icon={ChartNoAxesColumnIcon} value={draft.priority === "none" ? undefined : draft.priority}
          onChange={priority => set({ priority })}
          options={PRIORITIES.map(priority => ({ value: priority.value, label: priority.label, icon: <WorkItemPriorityIcon priority={priority.value} /> }))} />
        <OptionPill label="담당자" icon={UserIcon} value={draft.assigneeId} onChange={assigneeId => set({ assigneeId })}
          options={PEOPLE.map(person => ({ value: person.id, label: person.name, icon: <PersonAvatar person={person} className="size-4" /> }))} />
        <OptionPill label="라벨" icon={TagIcon} isMultiple value={draft.labelIds} onChange={labelIds => set({ labelIds })}
          options={LABELS.map(label => ({ value: label.id, label: label.name, icon: <WorkItemLabelDot color={label.color} /> }))} />
        <DatePill label="기한" value={draft.dueDate} format={formatWorkItemDate} onChange={dueDate => set({ dueDate })} />
      </>}>
      <ComposeFields title={draft.title} onTitle={title => set({ title: title.slice(0, 200) })} titlePlaceholder="업무 제목"
        body={draft.body} onBody={body => set({ body })} bodyPlaceholder="설명을 덧붙이세요…" />
    </ComposeSurface>
  )
}
