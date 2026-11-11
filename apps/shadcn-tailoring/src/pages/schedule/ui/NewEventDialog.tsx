import { useState, type FormEvent } from "react"
import { EVENT_CATEGORIES, EventDot, eventWhen, useCreateEvent, type EventCategory, type NewCalendarEvent } from "@/entities/event"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { Button } from "@/shared/ui/button"
import { DatePicker } from "@/shared/ui/date-picker"
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog"
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/shared/ui/drawer"
import { Field, FieldError, FieldLabel } from "@/shared/ui/field"
import { XIcon } from "@/shared/ui/icon"
import { Input } from "@/shared/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Switch } from "@/shared/ui/switch"
import { toast } from "@/shared/ui/toast"

const FORM_ID = "new-event"
const CATEGORY_ITEMS = EVENT_CATEGORIES.map(category => ({ value: category.value, label: category.label }))

type Draft = { title: string; date: string; isAllDay: boolean; from: string; to: string; category: EventCategory }
const emptyDraft = (date: string): Draft => ({ title: "", date, isAllDay: false, from: "10:00", to: "11:00", category: "meeting" })

const toEvent = (draft: Draft): NewCalendarEvent => ({
  title: draft.title.trim(), category: draft.category, isAllDay: draft.isAllDay || undefined,
  start: draft.isAllDay ? draft.date : `${draft.date}T${draft.from}`,
  end: draft.isAllDay ? draft.date : `${draft.date}T${draft.to}`,
})

/** 제목은 테두리 없는 큰 글씨, 그 아래 날짜 · 분류 · 종일 · 시각. */
function NewEventForm({ draft, onDraft, onSubmit }: { draft: Draft; onDraft: (draft: Draft) => void; onSubmit: () => void }) {
  const set = (change: Partial<Draft>) => onDraft({ ...draft, ...change })
  const isTimeWrong = !draft.isAllDay && draft.to <= draft.from
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (draft.title.trim() && draft.date && !isTimeWrong) onSubmit()
  }
  return (
    <form id={FORM_ID} onSubmit={submit} className="flex flex-col gap-5">
      <input aria-label="일정 제목" placeholder="일정 제목" autoFocus autoComplete="off" value={draft.title} onChange={event => set({ title: event.target.value })}
        className="w-full bg-transparent text-lg font-semibold outline-none placeholder:text-muted-foreground/70" />
      <div className="grid gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="new-event-date">날짜</FieldLabel>
          <DatePicker id="new-event-date" label="날짜" value={draft.date} onChange={date => set({ date })} />
        </Field>
        <Field>
          <FieldLabel id="new-event-category">분류</FieldLabel>
          <Select items={CATEGORY_ITEMS} value={draft.category} onValueChange={category => category && set({ category })}>
            <SelectTrigger aria-labelledby="new-event-category" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {EVENT_CATEGORIES.map(category => (
                  <SelectItem key={category.value} value={category.value}><EventDot category={category.value} />{category.label}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field orientation="horizontal" className="md:col-span-2">
          <Switch id="new-event-all-day" checked={draft.isAllDay} onCheckedChange={isAllDay => set({ isAllDay })} />
          <FieldLabel htmlFor="new-event-all-day">종일</FieldLabel>
        </Field>
        {!draft.isAllDay && (
          <>
            <Field>
              <FieldLabel htmlFor="new-event-from">시작</FieldLabel>
              <Input id="new-event-from" type="time" required value={draft.from} onChange={event => set({ from: event.target.value })} />
            </Field>
            <Field data-invalid={isTimeWrong || undefined}>
              <FieldLabel htmlFor="new-event-to">끝</FieldLabel>
              <Input id="new-event-to" type="time" required aria-invalid={isTimeWrong || undefined} value={draft.to} onChange={event => set({ to: event.target.value })} />
              {isTimeWrong && <FieldError>끝 시각은 시작보다 늦어야 합니다.</FieldError>}
            </Field>
          </>
        )}
      </div>
    </form>
  )
}

/**
 * 새 일정. 데스크톱은 대화상자, 휴대폰은 화면을 덮는 시트. 만들면 쿼리 캐시에 넣고 알린다(일정에는 계속 만들기를 두지 않는다).
 * 날짜는 처음 값이며, 바꾸려면 key로 새로 그린다.
 */
export function NewEventDialog({ open, onOpenChange, date }: { open: boolean; onOpenChange: (open: boolean) => void; date: string }) {
  const isMobile = useIsMobile()
  const create = useCreateEvent()
  const [draft, setDraft] = useState(() => emptyDraft(date))
  const submit = () => create.mutate(toEvent(draft), {
    onSuccess: event => {
      toast.add({ type: "success", title: "일정을 만들었습니다", description: `${event.title} · ${eventWhen(event)}` })
      setDraft(emptyDraft(date))
      onOpenChange(false)
    },
  })
  const isEmpty = !draft.title.trim()
  const form = <NewEventForm draft={draft} onDraft={setDraft} onSubmit={submit} />

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="[--drawer-content-height:100dvh] data-[swipe-axis=y]:[--drawer-content-max-height:100dvh]">
          <header className="flex h-13 shrink-0 items-center gap-2 border-b px-2">
            <DrawerClose render={<Button variant="ghost" size="icon" aria-label="닫기" />}><XIcon /></DrawerClose>
            <DrawerTitle className="flex-1 text-base font-semibold">새 일정</DrawerTitle>
            <Button type="submit" form={FORM_ID} disabled={isEmpty} className="rounded-full px-4">만들기</Button>
          </header>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">{form}</div>
        </DrawerContent>
      </Drawer>
    )
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-6 p-10 pt-8 sm:max-w-140">
        <DialogTitle className="text-xl font-semibold">새 일정</DialogTitle>
        {form}
        <div className="flex justify-end">
          <Button type="submit" form={FORM_ID} disabled={isEmpty} className="rounded-full px-3">만들기</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
