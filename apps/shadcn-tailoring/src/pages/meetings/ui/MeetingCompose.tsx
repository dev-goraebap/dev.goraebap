import { useState } from "react"
import {
  PEOPLE, PROJECTS, meetingHref, useCreateMeeting, useUpdateMeeting, type Meeting, type MeetingDraft, type MeetingEvent,
} from "@/entities/meeting"
import { paths } from "@/shared/config"
import { ComposeFields, ComposeSurface, PlaceChip } from "@/shared/ui/compose"
import { DateCalendar } from "@/shared/ui/date-picker"
import { Field, FieldGroup, FieldLabel, FieldTitle } from "@/shared/ui/field"
import { ClockIcon, MeetingIcon, ProjectsIcon, UsersIcon } from "@/shared/ui/icon"
import { InfoPill } from "@/shared/ui/info-pill"
import { Input } from "@/shared/ui/input"
import { type Crumb } from "@/shared/ui/page"
import { PersonAvatar } from "@/shared/ui/person-avatar"
import { OptionPill, PropertyPill } from "@/shared/ui/property-pill"
import { toast } from "@/shared/ui/toast"
import { carryDraft, useCarriedDraft } from "../model/panel"
import { MeetingAttachment } from "./MeetingAttachments"
import { heldOf, MeetingEventPill } from "./MeetingEventPicker"

const TITLE_MAX = 200
const NO_PROJECT = "none"

/**
 * 양식의 값. 회의 일시는 날짜와 시작 · 끝 시각(회사 시각)으로 나누어 고른다. 녹음(하나)과 사진은 고른 File 그대로 들고 있다가
 * 만들 때 붙인다. 일정을 이으면 회의 일시는 그 일정의 것이다.
 */
type Draft = {
  title: string; note: string; project: string; day: string; start: string; end: string; attendeeIds: string[]
  audio: File[]; photos: File[]; event?: MeetingEvent
}

const seoul = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" })
const clock = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })

const heldParts = (heldStart: string, heldEnd: string) => ({
  day: seoul.format(new Date(heldStart)), start: clock.format(new Date(heldStart)), end: clock.format(new Date(heldEnd)),
})

const draftOf = (meeting?: Meeting, project?: string): Draft => meeting
  ? {
      title: meeting.title, note: meeting.note ?? "", project: meeting.project ?? NO_PROJECT, ...heldParts(meeting.heldStart, meeting.heldEnd),
      attendeeIds: meeting.attendees.map(person => person.id), audio: [], photos: [], event: meeting.event,
    }
  : { title: "", note: "", project: project ?? NO_PROJECT, day: seoul.format(new Date()), start: "09:00", end: "10:00", attendeeIds: [], audio: [], photos: [] }

const toMeetingDraft = (draft: Draft): MeetingDraft => ({
  title: draft.title.trim(),
  note: draft.note.trim() || undefined,
  project: draft.project === NO_PROJECT ? undefined : draft.project,
  heldStart: `${draft.day}T${draft.start}:00+09:00`,
  heldEnd: `${draft.day}T${draft.end}:00+09:00`,
  attendees: PEOPLE.filter(person => draft.attendeeIds.includes(person.id)),
})

const dayText = (day: string) => `${Number(day.slice(5, 7))}월 ${Number(day.slice(8, 10))}일`

/** 만들 수 없는 까닭(호호코워크 MeetingCompose의 problem). 새 회의록은 녹음이 있어야 받아써서 회의록을 만든다. */
function problemOf(draft: Draft, isNew: boolean) {
  if (!draft.title.trim()) return "회의 제목을 입력해 주세요."
  if (draft.start >= draft.end) return "시작과 종료 시간을 확인해 주세요."
  if (isNew && draft.audio.length === 0) return "회의 녹음 파일을 선택해 주세요."
  return undefined
}

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
 * 새 회의록(/meetings/new) · 회의록 수정(호호코워크 MeetingCompose): 회의 제목과 참고 메모를 쓰고 일정 연결 · 프로젝트 · 회의 일시 ·
 * 참석자 · 회의 녹음 · 회의 사진을 알약으로 고른다. 녹음은 꼭 있어야 하고(받아써서 회의록을 만든다), 파일은 올릴 서버가 없어
 * 이 브라우저 안에만 둔다. 데스크톱에서 목록의 버튼으로 열면 그 위 대화상자, 링크 · 새로고침 · 크게 보기와 휴대폰은 자기 페이지.
 * 크게 보기는 고른 파일까지 쓰던 내용을 페이지로 넘긴다. 수정(이 앱에만 있다)은 파일과 일정을 바꾸지 않는다.
 */
export function MeetingCompose({ meeting, project, surface, onClose, onExpand, onSaved }: {
  /** 고칠 회의록. 없으면 새 회의록이다. */
  meeting?: Meeting
  /** 새 회의록의 처음 프로젝트(목록에서 한 프로젝트로 걸러 두었을 때, ?project=). */
  project?: string
  surface: "dialog" | "page"
  onClose: () => void
  /** 크게 보기: 같은 양식을 자기 페이지로. 대화상자에만 있다. */
  onExpand?: () => void
  onSaved: (id: string) => void
}) {
  const create = useCreateMeeting()
  const update = useUpdateMeeting()
  const carryKey = `meeting:${meeting?.id ?? "new"}`
  const carried = useCarriedDraft<Draft>(carryKey)
  const [draft, setDraft] = useState(() => carried ?? draftOf(meeting, project))
  const [hasTried, setTried] = useState(false)
  const set = (patch: Partial<Draft>) => setDraft(current => ({ ...current, ...patch }))
  const isNew = !meeting
  const isPending = create.isPending || update.isPending
  const problem = problemOf(draft, isNew)
  const submit = () => {
    setTried(true)
    if (problem) return
    const values = toMeetingDraft(draft)
    if (meeting) {
      update.mutate({ id: meeting.id, draft: values }, {
        onSuccess: () => {
          toast.add({ type: "success", title: "회의록을 고쳤습니다" })
          onSaved(meeting.id)
        },
      })
    } else {
      create.mutate({ ...values, audio: draft.audio[0], photos: draft.photos, event: draft.event }, {
        onSuccess: item => {
          toast.add({ type: "success", title: "회의록을 만들었습니다", description: "녹음을 받아쓰는 차례를 기다립니다." })
          onSaved(item.id)
        },
      })
    }
  }
  const crumbs: Crumb[] = meeting
    ? [{ label: "회의록", href: paths.meetings }, { label: meeting.title, href: meetingHref(meeting.id) }, { label: "회의록 수정" }]
    : [{ label: "회의록", href: paths.meetings }, { label: "새 회의록" }]
  const linkEvent = (event: Parameters<typeof heldOf>[0]) => {
    const held = heldOf(event)
    set({ event: { id: event.id, title: event.title }, ...heldParts(held.heldStart, held.heldEnd), ...(draft.title.trim() ? {} : { title: event.title }) })
  }
  return (
    <ComposeSurface surface={surface} crumbs={crumbs} chip={<PlaceChip icon={<MeetingIcon />} label="회의록" />} onClose={onClose}
      onExpand={onExpand && !isPending ? () => { carryDraft(carryKey, draft); onExpand() } : undefined}
      submit={{
        label: meeting ? "저장" : "회의록 만들기", onSubmit: submit,
        isDisabled: Boolean(meeting && problem), isPending,
      }}
      pills={<>
        {isNew && <MeetingEventPill value={draft.event} onPick={linkEvent} onClear={() => set({ event: undefined })} />}
        <OptionPill label="프로젝트" icon={ProjectsIcon} value={draft.project === NO_PROJECT ? undefined : draft.project} onChange={value => set({ project: value })}
          options={[{ value: NO_PROJECT, label: "프로젝트 없음" }, ...PROJECTS.map(name => ({ value: name, label: name, icon: <ProjectsIcon /> }))]} />
        {isNew && draft.event
          ? <InfoPill label="회의 일시" icon={<ClockIcon />}>{`${dayText(draft.day)} ${draft.start} – ${draft.end}`}</InfoPill>
          : (
            <PropertyPill label="회의 일시" icon={<ClockIcon />} text={`${dayText(draft.day)} ${draft.start} – ${draft.end}`} width="w-72">
              {() => <HeldFields draft={draft} onChange={set} />}
            </PropertyPill>
          )}
        <OptionPill label="참석자" icon={UsersIcon} isMultiple value={draft.attendeeIds} onChange={attendeeIds => set({ attendeeIds })}
          options={PEOPLE.map(person => ({ value: person.id, label: person.name, icon: <PersonAvatar id={person.id} name={person.name} className="size-4" /> }))} />
        {isNew && <>
          <MeetingAttachment kind="audio" files={draft.audio} onChange={audio => set({ audio })} isDisabled={isPending} />
          <MeetingAttachment kind="photo" files={draft.photos} onChange={photos => set({ photos })} isDisabled={isPending} />
        </>}
      </>}>
      <ComposeFields title={draft.title} onTitle={title => set({ title: title.slice(0, TITLE_MAX) })} titlePlaceholder="회의 제목"
        body={draft.note} onBody={note => set({ note })} bodyPlaceholder="요약에 참고할 내용을 적어 주세요" />
      {hasTried && problem && <p role="alert" className="text-sm text-destructive">{problem}</p>}
    </ComposeSurface>
  )
}
