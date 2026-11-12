import { dayTitle, EventDot, type CalendarEvent } from "@/entities/event"
import { UmbrellaIcon } from "@/shared/ui/icon"
import { dayGroups, factsOn, type DayGroup } from "../model/day-list"
import { EventPopover } from "./EventPopover"

/** 한 묶음의 줄(막대 먼저, 그다음 시각 순). 줄을 누르면 그 일정을 연다(휴대폰은 그 페이지, 데스크톱은 요약). */
function DayEventList({ day, group }: { day: string; group: DayGroup }) {
  return (
    <ul className="flex flex-col divide-y">
      {group.entries.map(event => (
        <li key={event.id}>
          <EventPopover event={event} trigger={
            <button type="button" className="-mx-2 flex w-[calc(100%+1rem)] items-start gap-3 rounded-md px-2 py-2.5 text-left outline-none hover:bg-row-hover focus-visible:ring-2 focus-visible:ring-ring">
              {group.kind === "leave"
                ? <UmbrellaIcon aria-hidden className="mt-0.5 shrink-0 text-icon-muted" />
                : <EventDot category={event.category} className="mt-[0.4375rem]" />}
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate">{event.title}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{factsOn(event, day)}</span>
              </span>
            </button>
          } />
        </li>
      ))}
    </ul>
  )
}

/**
 * 휴대폰 월간(호호코워크 DayAgenda): 고른 날의 제목(공휴일이면 이름을 휴일색으로 붙인다), 그 아래 일정 · 휴가 묶음.
 * 하루 목록 페이지와 같은 묶음(model/day-list)을 쓴다.
 */
export function DayAgenda({ day, holiday, events }: { day: string; holiday?: string; events: readonly CalendarEvent[] }) {
  const groups = dayGroups(day, events)
  return (
    <section aria-label={`${dayTitle(day)} 일정`} className="flex flex-col gap-3 px-4 py-3">
      <h2 className="text-base font-semibold">
        {dayTitle(day)}
        {holiday && <span className="text-sm font-medium text-day-off"> {holiday}</span>}
      </h2>
      {groups.length === 0 ? <p className="py-2 text-sm text-muted-foreground">이날은 일정이 없습니다.</p> : groups.map(group => (
        <section key={group.kind} aria-label={group.label} className="flex flex-col gap-1">
          <p className="text-xs font-medium text-muted-foreground">{group.label}</p>
          <DayEventList day={day} group={group} />
        </section>
      ))}
    </section>
  )
}
