import { useEffect, useRef, useState, type CSSProperties } from "react"
import {
  clock, currentMoment, dayNumber, dayTitle, eventTone, minuteOf, timeRange, weekdayOf, WEEKDAYS, type CalendarEvent,
} from "@/entities/event"
import { cn } from "@/shared/lib/utils"
import { layBars } from "../model/month-layout"
import { END_HOUR, layDay, START_HOUR } from "../model/week-layout"
import { dayTone, holidaySuffix, MARK_FILL, MARK_FOCUS, type HolidayNames } from "./day-style"
import { EventPopover } from "./EventPopover"

const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, index) => START_HOUR + index)
const DAY_COLUMNS = "grid-cols-[repeat(var(--days),minmax(0,1fr))]"

/** 지금 시각(2026-11-03T10:30). 1분마다 새로 읽어 지금 선이 따라간다. */
function useNow() {
  const [now, setNow] = useState(currentMoment)
  useEffect(() => {
    const timer = setInterval(() => setNow(currentMoment()), 60_000)
    return () => clearInterval(timer)
  }, [])
  return now
}

/**
 * 시간 축 위에 날들을 나란히 놓은 주간(호호코워크 WeekGrid). 요일 머리(hasHead), 종일 일정 줄, 그 아래 08–20시 격자가 남은 높이를
 * 채우고(한 시간 최소 3rem) 모자라면 스스로 넘긴다. 오늘이 보이면 지금 한 시간 앞에서, 아니면 아침 첫 시각에서 연다.
 * 데스크톱은 일곱 날, 휴대폰은 고른 하루. 머리의 일요일 · 공휴일은 휴일색이고 공휴일은 이름을 아래에 적는다.
 */
export function WeekGrid({ days, today, events, holidays, hasHead }: {
  days: string[]; today: string; events: readonly CalendarEvent[]; holidays: HolidayNames; hasHead: boolean
}) {
  const now = useNow()
  const scroll = useRef<HTMLElement>(null)
  const { bars } = layBars(events, days)
  const showsNow = days.some(day => now.startsWith(day))
  const dayKey = days.join()
  useEffect(() => {
    const area = scroll.current
    if (!area) return
    const hourHeight = area.scrollHeight / HOURS.length
    area.scrollTop = showsNow ? Math.max(0, (minuteOf(currentMoment()) / 60 - START_HOUR - 1) * hourHeight) : 0
  }, [dayKey, showsNow])
  // check-ui: allow-style 보이는 날 수와 시간 수는 격자 열 · 시간 높이를 정하는 데이터 값이다.
  const size = { "--days": days.length, "--hours": HOURS.length } as CSSProperties
  return (
    <section aria-label="주 달력" style={size} className="flex min-h-0 flex-1 flex-col">
      {hasHead && (
        <ol className={cn("grid shrink-0 overflow-hidden border-b pl-14 [scrollbar-gutter:stable]", DAY_COLUMNS)}>
          {days.map(day => (
            <li key={day} aria-label={`${dayTitle(day)}${holidaySuffix(day, holidays)}`}
              className={cn("flex min-w-0 flex-wrap items-center justify-center gap-x-1 border-l py-2", day === today ? "text-foreground" : dayTone(day, holidays) ?? "text-muted-foreground")}>
              <span className="text-xs font-medium">{WEEKDAYS[weekdayOf(day)]}</span>
              <time dateTime={day} aria-current={day === today ? "date" : undefined}
                className={cn("inline-grid h-6 min-w-6 place-items-center rounded-full px-1 text-sm font-semibold tabular-nums", day === today && "bg-primary text-primary-foreground")}>
                {dayNumber(day)}
              </time>
              {/* 공휴일 이름(호호코워크 .headHoliday): 요일과 날짜 아래 한 줄, 칸이 좁으면 줄인다. */}
              {holidays.has(day) && <span className="min-w-0 basis-full truncate text-center text-[0.6875rem]">{holidays.get(day)}</span>}
            </li>
          ))}
        </ol>
      )}
      <section aria-label="종일 일정" className="grid shrink-0 grid-cols-[3.5rem_minmax(0,1fr)] overflow-hidden border-b border-input [scrollbar-gutter:stable]">
        <span className="col-start-1 row-start-1 self-center pr-2 text-right text-[0.6875rem] text-muted-foreground">종일</span>
        <ol aria-hidden className={cn("col-start-2 row-start-1 grid", DAY_COLUMNS)}>
          {days.map(day => <li key={day} className={cn("border-l", day === today && "bg-accent")} />)}
        </ol>
        <ol className={cn("relative z-1 col-start-2 row-start-1 grid min-h-7 auto-rows-[1.25rem] gap-y-[3px] py-1", DAY_COLUMNS)}>
          {bars.map(bar => (
            // check-ui: allow-style 막대가 걸친 날(열)과 줄은 일정마다 계산한 위치다.
            <li key={bar.event.id} style={{ gridColumn: `${bar.column + 1} / span ${bar.span}`, gridRow: bar.lane + 1 }} className="min-w-0">
              <EventPopover event={bar.event} trigger={
                <button type="button"
                  className={cn(
                    eventTone(bar.event.category), MARK_FILL, MARK_FOCUS,
                    "mx-[3px] flex h-5 w-[calc(100%-6px)] items-center rounded-[3px] px-2 text-left text-xs font-medium",
                    bar.fromBefore && "ml-0 w-[calc(100%-3px)] rounded-l-none", bar.toAfter && "mr-0 w-[calc(100%-3px)] rounded-r-none",
                    bar.fromBefore && bar.toAfter && "w-full",
                  )}>
                  <span className="truncate">{bar.event.title}</span>
                </button>
              } />
            </li>
          ))}
        </ol>
      </section>
      <section ref={scroll} aria-label="시간대"
        className="grid min-h-0 flex-1 grid-cols-[3.5rem_minmax(0,1fr)] items-start overflow-y-auto overscroll-contain pt-4 pb-2 [container-type:size] [scrollbar-gutter:stable] [--hour:max(3rem,calc((100cqb-1.5rem)/var(--hours)))]">
        <ol aria-hidden>
          {HOURS.map(hour => (
            <li key={hour} className="relative h-(--hour)">
              <time className="absolute -top-[0.5em] right-2 text-[0.6875rem] leading-none text-muted-foreground tabular-nums">{`${String(hour).padStart(2, "0")}:00`}</time>
            </li>
          ))}
        </ol>
        <ol className={cn("grid border-b", DAY_COLUMNS)}>
          {days.map(day => <DayColumn key={day} day={day} events={events} isToday={day === today} now={now} />)}
        </ol>
      </section>
    </section>
  )
}

/** 하루 열: 시간마다 가는 선, 시각 일정 블록(겹치면 나란히), 오늘이면 지금 선. */
function DayColumn({ day, events, isToday, now }: { day: string; events: readonly CalendarEvent[]; isToday: boolean; now: string }) {
  const nowAt = now.startsWith(day) ? minuteOf(now) / 60 - START_HOUR : -1
  return (
    <li aria-label={`${dayTitle(day)} 일정`} className={cn("relative min-w-0 border-l", isToday && "bg-accent")}>
      <ol aria-hidden>{HOURS.map(hour => <li key={hour} className="h-(--hour) border-t" />)}</ol>
      <ol className="absolute inset-0">
        {layDay(events, day).map(block => {
          const isShort = block.length <= 0.75
          // check-ui: allow-style 블록의 시작 · 길이(시간)와 겹친 칸은 일정마다 계산한 위치다.
          const place: CSSProperties = {
            top: `calc(${block.from} * var(--hour))`, height: `calc(${block.length} * var(--hour))`,
            left: `${(block.lane * 100) / block.lanes}%`, width: `${100 / block.lanes}%`,
          }
          return (
            <li key={block.event.id} style={place} className="absolute px-0.5 py-px">
              <EventPopover event={block.event} trigger={
                <button type="button" aria-label={`${timeRange(block.event)} ${block.event.title}`}
                  className={cn(
                    eventTone(block.event.category), MARK_FILL, MARK_FOCUS,
                    "flex size-full overflow-hidden rounded-[3px] px-1.5 py-0.5 text-left",
                    isShort ? "items-center gap-1" : "flex-col gap-px",
                  )}>
                  <span className={cn("min-w-0 shrink-0 text-xs leading-snug font-semibold", isShort ? "flex-1 truncate" : "line-clamp-2")}>{block.event.title}</span>
                  <time dateTime={block.event.start} className="shrink-0 text-[0.6875rem] tabular-nums opacity-80">{clock(block.event.start)}</time>
                </button>
              } />
            </li>
          )
        })}
      </ol>
      {nowAt >= 0 && nowAt <= END_HOUR - START_HOUR && (
        // check-ui: allow-style 지금 시각의 위치다.
        <time dateTime={now} aria-label={`지금 ${clock(now)}`} style={{ top: `calc(${nowAt} * var(--hour))` }}
          className="pointer-events-none absolute inset-x-0 z-2 h-0 border-t-2 border-event-red-foreground before:absolute before:-top-[0.375rem] before:-left-[0.3125rem] before:size-2.5 before:rounded-full before:bg-event-red-foreground" />
      )}
    </li>
  )
}
