import type { ReactElement } from "react"
import { byDayOrder, covers, dayTitle, EventDot, timeRange, type CalendarEvent } from "@/entities/event"
import { AdaptivePopover } from "@/shared/ui/adaptive-popover"
import { EventPopover } from "./EventPopover"

/** 하루의 일정 목록(막대 먼저, 그다음 시각 순). 줄을 누르면 그 일정의 요약이 뜬다. */
export function DayEventList({ day, events }: { day: string; events: readonly CalendarEvent[] }) {
  const list = events.filter(event => covers(event, day)).sort(byDayOrder)
  if (list.length === 0) return <p className="py-2 text-sm text-muted-foreground">이날은 일정이 없습니다.</p>
  return (
    <ul className="flex flex-col divide-y">
      {list.map(event => (
        <li key={event.id}>
          <EventPopover event={event} trigger={
            <button type="button" className="-mx-2 flex w-[calc(100%+1rem)] items-start gap-3 rounded-md px-2 py-2.5 text-left outline-none hover:bg-row-hover focus-visible:ring-2 focus-visible:ring-ring">
              <EventDot category={event.category} className="mt-[0.4375rem]" />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate">{event.title}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{[timeRange(event), event.location].filter(Boolean).join(" · ")}</span>
              </span>
            </button>
          } />
        </li>
      ))}
    </ul>
  )
}

/** 휴대폰 월간: 고른 날의 제목(공휴일이면 이름을 휴일색으로 붙인다), 개수, 일정 목록. */
export function DayAgenda({ day, holiday, events }: { day: string; holiday?: string; events: readonly CalendarEvent[] }) {
  const count = events.filter(event => covers(event, day)).length
  return (
    <section aria-label={`${dayTitle(day)} 일정`} className="flex flex-col gap-3 px-4 py-3">
      <h2 className="text-base font-semibold">
        {dayTitle(day)}
        {holiday && <span className="text-sm font-medium text-day-off"> {holiday}</span>}
      </h2>
      {count > 0 && <p className="text-xs font-medium text-muted-foreground">일정 {count}</p>}
      <DayEventList day={day} events={events} />
    </section>
  )
}

/** "+N 더보기": 그 날의 모든 일정을 연다. 데스크톱 팝오버, 휴대폰 바텀시트. 공휴일이면 제목에 이름을 붙인다. */
export function DayMorePopover({ day, holiday, events, trigger }: { day: string; holiday?: string; events: readonly CalendarEvent[]; trigger: ReactElement }) {
  const title = holiday ? `${dayTitle(day)} ${holiday}` : dayTitle(day)
  return (
    <AdaptivePopover title={title} trigger={trigger} className="w-80 p-3">
      <div className="flex flex-col gap-1">
        <p className="font-semibold max-md:hidden">{dayTitle(day)}{holiday && <span className="text-sm font-medium text-day-off"> {holiday}</span>}</p>
        <DayEventList day={day} events={events} />
      </div>
    </AdaptivePopover>
  )
}
