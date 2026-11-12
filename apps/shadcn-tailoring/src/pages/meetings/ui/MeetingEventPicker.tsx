import { clock, dayOf, eventWhen, useEvents, type CalendarEvent } from "@/entities/event"
import type { MeetingEvent } from "@/entities/meeting"
import { CalendarIcon, XIcon } from "@/shared/ui/icon"
import { OptionList } from "@/shared/ui/option-list"
import { PropertyPill } from "@/shared/ui/property-pill"

const UNLINK = "__unlink"

/** 고른 일정이 정하는 회의 일시(일정은 시간대 없이 서울 시각으로 적혀 있다). */
export const heldOf = (event: CalendarEvent) => ({
  heldStart: `${dayOf(event.start)}T${clock(event.start)}:00+09:00`,
  heldEnd: `${dayOf(event.end)}T${clock(event.end)}:00+09:00`,
})

/**
 * 일정 연결 알약(호호코워크 MeetingEventPicker): 회사 일정에서 제목으로 찾아 고르면 회의록이 그 일정에 이어지고, 제목과
 * 회의 일시를 그 일정에서 가져온다. 시각이 있는 일정만 고를 수 있다(회의 일시가 필요하다). 이어 둔 것은 연결 해제로 뗀다.
 */
export function MeetingEventPill({ value, onPick, onClear }: {
  value?: MeetingEvent
  onPick: (event: CalendarEvent) => void
  onClear: () => void
}) {
  const { data, isPending } = useEvents()
  const events = (data ?? []).filter(event => !event.isAllDay).sort((a, b) => b.start.localeCompare(a.start))
  const options = [
    ...(value ? [{ value: UNLINK, label: "일정 연결 해제", icon: <XIcon /> }] : []),
    ...events.map(event => ({ value: event.id, label: event.title, icon: <CalendarIcon />, end: <span className="text-xs text-muted-foreground tabular-nums">{eventWhen(event)}</span> })),
  ]
  return (
    <PropertyPill label="일정 연결" icon={<CalendarIcon />} text={value?.title} width="w-92">
      {close => isPending
        ? <p className="px-2 py-1.5 text-sm text-muted-foreground">일정을 불러오는 중</p>
        : options.length === 0
          ? <p className="px-2 py-1.5 text-sm text-muted-foreground">표시할 일정이 없습니다.</p>
          : (
            <OptionList label="이을 일정 고르기" options={options} chosen={value ? [value.id] : []} isSearchable
              onPick={id => {
                const picked = events.find(event => event.id === id)
                if (id === UNLINK) onClear()
                else if (picked) onPick(picked)
                close()
              }} />
          )}
    </PropertyPill>
  )
}
