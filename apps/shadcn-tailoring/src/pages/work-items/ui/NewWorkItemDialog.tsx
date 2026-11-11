import { useState, type FormEvent } from "react"
import {
  LABELS, PEOPLE, PRIORITIES, STATUSES, TYPES, PersonAvatar, WorkItemLabelDot, WorkItemPriorityIcon, WorkItemStatusIcon,
  formatWorkItemDate, statusMark, typeMark, useCreateWorkItem,
  type WorkItemPriority, type WorkItemStatus, type WorkItemType,
} from "@/entities/work-item"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog"
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/shared/ui/drawer"
import { ChartNoAxesColumnIcon, ListChecksIcon, ProjectsIcon, SquareCheckIcon, TagIcon, UserIcon, XIcon } from "@/shared/ui/icon"
import { DatePill, OptionPill } from "@/shared/ui/property-pill"
import { Switch } from "@/shared/ui/switch"
import { toast } from "@/shared/ui/toast"

const FORM_ID = "new-work-item"

type Draft = {
  title: string; body: string; type: WorkItemType; status: WorkItemStatus; priority: WorkItemPriority
  assigneeId?: string; labelIds: string[]; dueDate?: string
}
const emptyDraft = (status: WorkItemStatus): Draft => ({ title: "", body: "", type: "task", status, priority: "none", labelIds: [] })

/** 제목과 본문을 종이 위에 쓰고, 아래 알약으로 유형 · 상태 · 우선순위 · 담당자 · 라벨 · 마감을 고른다. */
function NewWorkItemForm({ draft, onDraft, onSubmit }: { draft: Draft; onDraft: (draft: Draft) => void; onSubmit: () => void }) {
  const set = (change: Partial<Draft>) => onDraft({ ...draft, ...change })
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (draft.title.trim()) onSubmit()
  }
  return (
    <form id={FORM_ID} onSubmit={submit} className="flex flex-col gap-3">
      <input aria-label="업무 제목" placeholder="업무 제목" autoFocus autoComplete="off" value={draft.title} onChange={event => set({ title: event.target.value })}
        className="w-full bg-transparent text-lg font-semibold outline-none placeholder:text-muted-foreground/70" />
      <textarea aria-label="설명" placeholder="설명을 덧붙이세요…" rows={3} value={draft.body} onChange={event => set({ body: event.target.value })}
        className="field-sizing-content min-h-16 w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/70" />
      <div role="group" aria-label="속성" className="flex flex-wrap gap-1.5 pt-2">
        <OptionPill label="유형" icon={ListChecksIcon} value={draft.type} onChange={type => set({ type: type })}
          options={TYPES.map(type => ({ value: type.value, label: type.label, icon: <type.icon /> }))} />
        <OptionPill label="상태" icon={SquareCheckIcon} value={draft.status} onChange={status => set({ status: status })}
          options={STATUSES.map(status => ({ value: status.value, label: status.label, icon: <WorkItemStatusIcon status={status.value} /> }))} />
        <OptionPill label="우선순위" icon={ChartNoAxesColumnIcon} value={draft.priority === "none" ? undefined : draft.priority}
          onChange={priority => set({ priority: priority })}
          options={PRIORITIES.map(priority => ({ value: priority.value, label: priority.label, icon: <WorkItemPriorityIcon priority={priority.value} /> }))} />
        <OptionPill label="담당자" icon={UserIcon} value={draft.assigneeId} onChange={assigneeId => set({ assigneeId })}
          options={PEOPLE.map(person => ({ value: person.id, label: person.name, icon: <PersonAvatar person={person} className="size-4" /> }))} />
        <OptionPill label="라벨" icon={TagIcon} isMultiple value={draft.labelIds} onChange={labelIds => set({ labelIds })}
          options={LABELS.map(label => ({ value: label.id, label: label.name, icon: <WorkItemLabelDot color={label.color} /> }))} />
        <DatePill label="기한" value={draft.dueDate} format={formatWorkItemDate} onChange={dueDate => set({ dueDate })} />
      </div>
    </form>
  )
}

/** 머리의 프로젝트 칩. */
function ProjectChip() {
  return (
    <span className="inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-secondary px-2 text-xs font-medium">
      <ProjectsIcon className="size-3.5" />cowork
    </span>
  )
}

/**
 * 새 업무(호호코워크 새 업무 양식). 데스크톱은 대화상자, 휴대폰은 화면 전체를 덮는 시트. 만들면 쿼리 캐시에 넣고 알린다.
 * 계속 만들기를 켜면 양식을 비우고 열어 둔다. 상태는 처음 값이며, 바꾸려면 key로 새로 그린다.
 */
export function NewWorkItemDialog({ open, onOpenChange, status = "todo" }: {
  open: boolean; onOpenChange: (open: boolean) => void; status?: WorkItemStatus
}) {
  const isMobile = useIsMobile()
  const create = useCreateWorkItem()
  const [draft, setDraft] = useState(() => emptyDraft(status))
  const [isContinuing, setContinuing] = useState(false)
  const submit = () => {
    const assignee = PEOPLE.find(person => person.id === draft.assigneeId)
    create.mutate({
      title: draft.title.trim(), body: draft.body.trim() || undefined, type: draft.type, status: draft.status, priority: draft.priority,
      assignee, labels: LABELS.filter(label => draft.labelIds.includes(label.id)), dueDate: draft.dueDate,
    }, {
      onSuccess: item => {
        toast.add({ type: "success", title: "업무를 만들었습니다", description: `${item.key} · ${statusMark(item.status).label} · ${typeMark(item.type).label}` })
        setDraft(emptyDraft(draft.status))
        if (!isContinuing) onOpenChange(false)
      },
    })
  }
  const isEmpty = !draft.title.trim()
  const form = <NewWorkItemForm draft={draft} onDraft={setDraft} onSubmit={submit} />

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="[--drawer-content-height:100dvh] data-[swipe-axis=y]:[--drawer-content-max-height:100dvh]">
          <header className="flex h-13 shrink-0 items-center gap-2 border-b px-2">
            <DrawerClose render={<Button variant="ghost" size="icon" aria-label="닫기" />}><XIcon /></DrawerClose>
            <DrawerTitle className="flex-1 text-base font-semibold">새 업무</DrawerTitle>
            <Button type="submit" form={FORM_ID} disabled={isEmpty} className="rounded-full px-4">만들기</Button>
          </header>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
            <ProjectChip />
            {form}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-6 p-10 pt-8 sm:max-w-180">
        <div className="flex items-center gap-3 pr-8">
          <ProjectChip />
          <DialogTitle className="text-xl font-semibold">새 업무</DialogTitle>
        </div>
        {form}
        <div className="flex items-center justify-end gap-3">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={isContinuing} onCheckedChange={setContinuing} />
            계속 만들기
          </label>
          <Button type="submit" form={FORM_ID} disabled={isEmpty} className="rounded-full px-3">만들기</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

