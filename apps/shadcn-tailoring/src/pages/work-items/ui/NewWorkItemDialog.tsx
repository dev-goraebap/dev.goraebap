import { useState, type FormEvent, type ReactNode } from "react"
import {
  LABELS, PEOPLE, PRIORITIES, STATUSES, TYPES, PersonAvatar, WorkItemLabelDot, WorkItemPriorityIcon, WorkItemStatusIcon,
  formatWorkItemDate, statusMark, typeMark, useCreateWorkItem,
  type WorkItemPriority, type WorkItemStatus, type WorkItemType,
} from "@/entities/work-item"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { AdaptivePopover } from "@/shared/ui/adaptive-popover"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog"
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/shared/ui/drawer"
import { Field, FieldLabel } from "@/shared/ui/field"
import {
  CalendarIcon, ChartNoAxesColumnIcon, ListChecksIcon, ProjectsIcon, SquareCheckIcon, TagIcon, UserIcon, XIcon, type Icon,
} from "@/shared/ui/icon"
import { Input } from "@/shared/ui/input"
import { Switch } from "@/shared/ui/switch"
import { toast } from "@/shared/ui/toast"
import { toggled } from "./FilterMenu"
import { OptionList, type Option } from "./OptionList"

const FORM_ID = "new-work-item"

/**
 * 속성 알약(호호코워크 OptionPill): 가는 테두리의 둥근 알약에 아이콘과 이름(고르면 고른 값). 누르면 고를 것 목록이 뜬다
 * (데스크톱 팝오버, 휴대폰 바텀시트).
 */
function PropertyPill({ label, icon: PillIcon, value, children }: { label: string; icon: Icon; value?: ReactNode; children: (close: () => void) => ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  return (
    <AdaptivePopover title={label} open={isOpen} onOpenChange={setOpen} className="w-60 p-1.5"
      trigger={
        <Button type="button" variant="outline" size="xs" aria-label={label} className="rounded-full max-md:h-9 max-md:px-3 max-md:text-sm">
          {value ?? <><PillIcon data-icon="inline-start" />{label}</>}
        </Button>
      }>
      {children(() => setOpen(false))}
    </AdaptivePopover>
  )
}

/** 한 값을 고르는 알약: 고르면 닫힌다. */
function SinglePill<T extends string>({ label, icon, options, value, onChange }: {
  label: string; icon: Icon; options: (Option & { value: T })[]; value?: T; onChange: (value: T) => void
}) {
  const current = options.find(option => option.value === value)
  return (
    <PropertyPill label={label} icon={icon} value={current && <>{current.icon}{current.label}</>}>
      {close => <OptionList label={label} options={options} chosen={value ? [value] : []} onPick={picked => { onChange(picked as T); close() }} />}
    </PropertyPill>
  )
}

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
  const labels = LABELS.filter(label => draft.labelIds.includes(label.id))
  return (
    <form id={FORM_ID} onSubmit={submit} className="flex flex-col gap-3">
      <input aria-label="업무 제목" placeholder="업무 제목" autoFocus autoComplete="off" value={draft.title} onChange={event => set({ title: event.target.value })}
        className="w-full bg-transparent text-lg font-semibold outline-none placeholder:text-muted-foreground/70" />
      <textarea aria-label="설명" placeholder="설명을 덧붙이세요…" rows={3} value={draft.body} onChange={event => set({ body: event.target.value })}
        className="field-sizing-content min-h-16 w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/70" />
      <div role="group" aria-label="속성" className="flex flex-wrap gap-1.5 pt-2">
        <SinglePill label="유형" icon={ListChecksIcon} value={draft.type} onChange={type => set({ type })}
          options={TYPES.map(type => ({ value: type.value, label: type.label, icon: <type.icon data-icon="inline-start" /> }))} />
        <SinglePill label="상태" icon={SquareCheckIcon} value={draft.status} onChange={status => set({ status })}
          options={STATUSES.map(status => ({ value: status.value, label: status.label, icon: <WorkItemStatusIcon status={status.value} /> }))} />
        <SinglePill label="우선순위" icon={ChartNoAxesColumnIcon} value={draft.priority === "none" ? undefined : draft.priority}
          onChange={priority => set({ priority })}
          options={PRIORITIES.map(priority => ({ value: priority.value, label: priority.label, icon: <WorkItemPriorityIcon priority={priority.value} /> }))} />
        <SinglePill label="담당자" icon={UserIcon} value={draft.assigneeId} onChange={assigneeId => set({ assigneeId })}
          options={PEOPLE.map(person => ({ value: person.id, label: person.name, icon: <PersonAvatar person={person} className="size-4" /> }))} />
        <PropertyPill label="라벨" icon={TagIcon}
          value={labels.length === 0 ? undefined : <>{labels.slice(0, 2).map(label => <WorkItemLabelDot key={label.id} color={label.color} />)}{labels.map(label => label.name).join(", ")}</>}>
          {() => (
            <OptionList label="라벨" isSearchable chosen={draft.labelIds} onPick={id => set({ labelIds: toggled(draft.labelIds, id) })}
              options={LABELS.map(label => ({ value: label.id, label: label.name, icon: <WorkItemLabelDot color={label.color} /> }))} />
          )}
        </PropertyPill>
        <PropertyPill label="기한" icon={CalendarIcon}
          value={draft.dueDate && <><CalendarIcon data-icon="inline-start" />{formatWorkItemDate(draft.dueDate)}</>}>
          {() => (
            <Field className="p-1.5">
              <FieldLabel htmlFor="new-work-item-due">마감일</FieldLabel>
              <Input id="new-work-item-due" type="date" value={draft.dueDate ?? ""} onChange={event => set({ dueDate: event.target.value || undefined })} />
            </Field>
          )}
        </PropertyPill>
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

