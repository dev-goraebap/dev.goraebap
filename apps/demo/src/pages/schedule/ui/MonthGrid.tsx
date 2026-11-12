import { useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react"
import {
  clock, dayNumber, dayTitle, eventTone, EventDot, isSameMonth, monthDay, monthTitle, monthWeeks, shortClock, WEEKDAYS, type CalendarEvent,
} from "@/entities/event"
import { cn } from "@/shared/lib/utils"
import { fitWeek, weekRows } from "../model/month-layout"
import { dayTone, MARK_FILL, MARK_FOCUS, TODAY_HATCH, weekdayTone, type HolidayNames } from "./day-style"
import { EventPopover } from "./EventPopover"

/** 주 안에서 표시가 놓일 칸과 줄. check-ui: allow-style 일정마다 계산한 격자 위치다. */
const at = (column: number, row: number | string, span = 1, rows = 1): CSSProperties =>
  ({ gridColumn: `${column + 1} / span ${span}`, gridRow: typeof row === "string" ? row : `${row} / span ${rows}` })

/** 격자 한 주의 높이(px)와 rem. 여섯 주가 높이를 나누므로 주에 들어갈 줄 수가 여기서 정해진다. */
function useWeekRoom(grid: RefObject<HTMLElement | null>) {
  const [room, setRoom] = useState({ height: 0, rem: 16 })
  useLayoutEffect(() => {
    const element = grid.current
    if (!element) return
    const measure = () => setRoom({ height: element.clientHeight / 6, rem: parseFloat(getComputedStyle(document.documentElement).fontSize) })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [grid])
  return room
}

/**
 * 데스크톱 월간(호호코워크 MonthGrid): 요일 줄 아래 여섯 주가 높이를 나누고, 가는 선으로 날과 주를 나눈다. 날짜는 요일 이름과 같은
 * 왼쪽 시작점(1일은 "11월 1일"), 그 아래 여러 날 막대, 그다음 시각 일정 한 줄씩, 넘친 것은 "+N 더보기". 다른 달의 날은 흐리게.
 * 날 칸 전체가 단추라 막대 · 줄이 없는 곳을 누르면 그날(onDay: 하루 목록)이 열리고, 막대 · 줄은 그 위에 떠서 일정 요약을 연다.
 * "+N 더보기"도 그날을 연다(호호코워크 onMore = onShowDay). 열린 날(selected)은 옅은 바탕.
 */
export function MonthGrid({ month, today, events, holidays, selected, onDay }: {
  month: string; today: string; events: readonly CalendarEvent[]; holidays: HolidayNames; selected?: string; onDay: (day: string) => void
}) {
  const grid = useRef<HTMLOListElement>(null)
  const room = useWeekRoom(grid)
  return (
    <section aria-label={monthTitle(month)} className="flex min-h-0 min-w-0 flex-1 flex-col">
      <ol aria-hidden className="grid shrink-0 grid-cols-7 border-b">
        {WEEKDAYS.map((name, index) => (
          <li key={name} className={cn("py-2 ps-[calc(0.75rem+1px)] text-xs leading-normal font-semibold", weekdayTone(index) ?? "text-muted-foreground")}>{name}</li>
        ))}
      </ol>
      <ol ref={grid} className="grid min-h-0 flex-1 grid-rows-[repeat(6,minmax(0,1fr))]">
        {monthWeeks(month).map(days => {
          const { week, inlineFoot } = fitWeek(days, events, room.height, room.rem)
          const timedRow = 2 + week.barLanes
          const footRow = timedRow + week.timedLines
          const isOutside = (column: number) => !isSameMonth(days[column], month)
          return (
            // check-ui: allow-style 주마다 들어간 막대 · 시각 줄 수로 계산한 격자 줄이다.
            <li key={days[0]} style={{ gridTemplateRows: weekRows(week, inlineFoot) }}
              className="relative grid min-h-0 grid-cols-7 gap-y-[3px] overflow-hidden border-b pb-1 last:border-b-0">
              {days.map((day, column) => {
                const hasInlineMore = inlineFoot && week.hidden[column] > 0
                const holiday = holidays.get(day)
                return (
                  <button key={day} type="button" style={at(column, "1 / -1")} onClick={() => onDay(day)}
                    aria-label={`${dayTitle(day)}${holiday ? ` ${holiday}` : ""}`} aria-pressed={day === selected} aria-current={day === today ? "date" : undefined}
                    className={cn(
                      "-mb-1 flex min-w-0 items-start gap-1 border-l px-3 pt-1 text-left outline-none first:border-l-transparent hover:bg-row-hover",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                      dayTone(day, holidays), day === today && TODAY_HATCH, day === selected && "bg-pressed hover:bg-pressed",
                    )}>
                    <time dateTime={day}
                      className={cn("inline-flex h-6 min-w-[1em] shrink-0 items-center justify-center text-xs font-semibold tabular-nums", isOutside(column) && "opacity-40")}>
                      {day.endsWith("-01") && !hasInlineMore ? monthDay(day) : dayNumber(day)}
                    </time>
                    {/* 공휴일 이름(호호코워크 .holiday): 날짜 옆에 작게, 칸이 좁으면 줄인다. */}
                    {holiday && <span className={cn("min-w-0 truncate text-[0.6875rem] leading-6", isOutside(column) && "opacity-40", hasInlineMore && "pe-6")}>{holiday}</span>}
                  </button>
                )
              })}
              {week.bars.map(bar => (
                <EventPopover key={bar.event.id} event={bar.event} trigger={
                  <button type="button" style={at(bar.column, 2 + bar.lane, bar.span)}
                    className={cn(
                      eventTone(bar.event.category), MARK_FILL, MARK_FOCUS,
                      "relative z-1 mx-[3px] flex h-5 min-w-0 items-center rounded-[3px] px-2 text-left text-xs font-medium",
                      bar.fromBefore && "ml-0 rounded-l-none", bar.toAfter && "mr-0 rounded-r-none", isOutside(bar.column) && "opacity-50",
                    )}>
                    <span className="truncate">{bar.event.title}</span>
                  </button>
                } />
              ))}
              {week.timed.map((list, column) => list.length > 0 && (
                <ol key={`timed-${days[column]}`} style={at(column, timedRow, 1, week.timedLines)}
                  className={cn("pointer-events-none relative z-1 flex min-w-0 flex-col gap-[3px] overflow-hidden px-[3px]",
                    isOutside(column) ? "opacity-50" : days[column] < today && "opacity-60")}>
                  {list.map(event => (
                    <li key={event.id}>
                      <EventPopover event={event} trigger={
                        <button type="button" aria-label={`${clock(event.start)} ${event.title}`}
                          className={cn(MARK_FOCUS, "pointer-events-auto flex h-[1.3125rem] w-full min-w-0 items-center gap-1 rounded-[3px] px-1 text-left hover:bg-accent")}>
                          <EventDot category={event.category} />
                          <time dateTime={event.start} className="shrink-0 text-[0.6875rem] text-muted-foreground tabular-nums">{shortClock(event.start)}</time>
                          <span className="truncate text-xs">{event.title}</span>
                        </button>
                      } />
                    </li>
                  ))}
                </ol>
              ))}
              {week.hidden.map((count, column) => count > 0 && (
                <button key={`more-${days[column]}`} type="button" aria-label={`${dayTitle(days[column])} 일정 ${count}개 더보기`} style={at(column, inlineFoot ? 1 : footRow)}
                  onClick={() => onDay(days[column])}
                  className={cn(MARK_FOCUS, "relative z-1 mx-[3px] h-5 justify-self-start rounded-[3px] px-1.5 text-[0.6875rem] font-semibold text-muted-foreground hover:bg-accent hover:text-foreground",
                    inlineFoot && "mt-1 self-start justify-self-end")}>
                  +{count}{inlineFoot ? "" : " 더보기"}
                </button>
              ))}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
