import { useState } from "react"
import {
  PEOPLE, PROJECTS, meetingHref, useCreateMeeting, useUpdateMeeting, type Meeting, type MeetingDraft,
} from "@/entities/meeting"
import { paths } from "@/shared/config"
import { ComposeFields, ComposeSurface, PlaceChip } from "@/shared/ui/compose"
import { DateCalendar } from "@/shared/ui/date-picker"
import { Field, FieldGroup, FieldLabel, FieldTitle } from "@/shared/ui/field"
import { ClockIcon, MeetingIcon, ProjectsIcon, UsersIcon } from "@/shared/ui/icon"
import { Input } from "@/shared/ui/input"
import { type Crumb } from "@/shared/ui/page"
import { PersonAvatar } from "@/shared/ui/person-avatar"
import { OptionPill, PropertyPill } from "@/shared/ui/property-pill"
import { toast } from "@/shared/ui/toast"

const TITLE_MAX = 200
const NO_PROJECT = "none"

/** 양식의 값. 회의 일시는 날짜와 시작 · 끝 시각(회사 시각)으로 나누어 고른다. */
type Draft = { title: string; note: string; project: string; day: string; start: string; end: string; attendeeIds: string[] }

const seoul = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" })
const clock = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })

const draftOf = (meeting?: Meeting): Draft => meeting
  ? {
      title: meeting.title, note: meeting.note ?? "", project: meeting.project ?? NO_PROJECT, day: seoul.format(new Date(meeting.heldStart)),
      start: clock.format(new Date(meeting.heldStart)), end: clock.format(new Date(meeting.heldEnd)), attendeeIds: meeting.attendees.map(person => person.id),
    }
  : { title: "", note: "", project: NO_PROJECT, day: seoul.format(new Date()), start: "09:00", end: "10:00", attendeeIds: [] }

const toMeetingDraft = (draft: Draft): MeetingDraft => ({
  title: draft.title.trim(),
  note: draft.note.trim() || undefined,
  project: draft.project === NO_PROJECT ? undefined : draft.project,
  heldStart: `${draft.day}T${draft.start}:00+09:00`,
  heldEnd: `${draft.day}T${draft.end}:00+09:00`,
  attendees: PEOPLE.filter(person => draft.attendeeIds.includes(person.id)),
})

const dayText = (day: string) => `${Number(day.slice(5, 7))}월 ${Number(day.slice(8, 10))}일`

/** 회의 일시: 날짜(달력)와 시작 · 끝 시각. */
function HeldFields({ draft, onChange }: { draft: Draft; onChange: (patch: Partial<Draft>) => void }) {
  return (
    <FieldGroup className="gap-3 p-1.5">
      <Field>
        <FieldTitle id="meeting-day">날짜</FieldTitle>
        <DateCalendar labelledBy="meeting-day" value={draft.day} onChange={day => onChange({ day })} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field>
          <FieldLabel htmlFor="meeting-start">시작</FieldLabel>
          <Input id="meeting-start" type="time" required value={draft.start} onChange={event => event.target.value && onChange({ start: event.target.value })} />
        </Field>
        <Field data-invalid={draft.start >= draft.end || undefined}>
          <FieldLabel htmlFor="meeting-end">끝</FieldLabel>
          <Input id="meeting-end" type="time" required value={draft.end} aria-invalid={draft.start >= draft.end || undefined}
            onChange={event => event.target.value && onChange({ end: event.target.value })} />
        </Field>
      </div>
    </FieldGroup>
  )
}

/**
 * 새 회의록 · 회의록 수정(호호코워크 MeetingCompose): 회의 제목과 참고 메모를 쓰고 프로젝트 · 회의 일시 · 참석자를 알약으로 고른다.
 * 호호코워크는 회의 녹음을 올려 받아쓰고 요약하지만, 이 앱에는 그 서버가 없어 녹음 알약을 두지 않는다.
 */
export function MeetingCompose({ meeting, surface, onClose, onSaved }: {
  /** 고칠 회의록. 없으면 새 회의록이다. */
  meeting?: Meeting
  surface: "dialog" | "page"
  onClose: () => void
  onSaved: (id: string) => void
}) {
  const create = useCreateMeeting()
  const update = useUpdateMeeting()
  const [draft, setDraft] = useState(() => draftOf(meeting))
  const set = (patch: Partial<Draft>) => setDraft(current => ({ ...current, ...patch }))
  const submit = () => {
    const values = toMeetingDraft(draft)
    if (meeting) {
      update.mutate({ id: meeting.id, draft: values }, {
        onSuccess: () => {
          toast.add({ type: "success", title: "회의록을 고쳤습니다" })
          onSaved(meeting.id)
        },
      })
    } else {
      create.mutate(values, {
        onSuccess: item => {
          toast.add({ type: "success", title: "회의록을 만들었습니다", description: item.title })
          onSaved(item.id)
        },
      })
    }
  }
  const crumbs: Crumb[] = meeting
    ? [{ label: "회의록", href: paths.meetings }, { label: meeting.title, href: meetingHref(meeting.id) }, { label: "회의록 수정" }]
    : [{ label: "회의록", href: paths.meetings }, { label: "새 회의록" }]
  return (
    <ComposeSurface surface={surface} crumbs={crumbs} chip={<PlaceChip icon={<MeetingIcon />} label="회의록" />} onClose={onClose}
      submit={{
        label: meeting ? "저장" : "회의록 만들기", onSubmit: submit,
        isDisabled: !draft.title.trim() || draft.start >= draft.end, isPending: create.isPending || update.isPending,
      }}
      pills={<>
        <OptionPill label="프로젝트" icon={ProjectsIcon} value={draft.project === NO_PROJECT ? undefined : draft.project} onChange={project => set({ project })}
          options={[{ value: NO_PROJECT, label: "프로젝트 없음" }, ...PROJECTS.map(project => ({ value: project, label: project, icon: <ProjectsIcon /> }))]} />
        <PropertyPill label="회의 일시" icon={<ClockIcon />} text={`${dayText(draft.day)} ${draft.start} – ${draft.end}`} width="w-72">
          {() => <HeldFields draft={draft} onChange={set} />}
        </PropertyPill>
        <OptionPill label="참석자" icon={UsersIcon} isMultiple value={draft.attendeeIds} onChange={attendeeIds => set({ attendeeIds })}
          options={PEOPLE.map(person => ({ value: person.id, label: person.name, icon: <PersonAvatar id={person.id} name={person.name} className="size-4" /> }))} />
      </>}>
      <ComposeFields title={draft.title} onTitle={title => set({ title: title.slice(0, TITLE_MAX) })} titlePlaceholder="회의 제목"
        body={draft.note} onBody={note => set({ note })} bodyPlaceholder="요약에 참고할 내용을 적어 주세요" />
    </ComposeSurface>
  )
}
