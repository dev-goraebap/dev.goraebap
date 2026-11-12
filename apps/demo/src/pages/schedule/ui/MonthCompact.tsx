import { covers, dayNumber, dayTitle, EventDot, isSameMonth, monthTitle, monthWeeks, WEEKDAYS, type CalendarEvent } from "@/entities/event"
import { cn } from "cn"
import { dayTone, holidaySuffix, TODAY_HATCH, weekdayTone, type HolidayNames } from "./day-style"

/** 휴대폰의 날 아래 점 수. 일정이 더 많아도 셋까지. */
const DOTS = 3

/**
 * 휴대폰 월간(호호코워크 MonthCompact): 같은 여섯 주를 날짜와 일정 색 점(셋까지)만으로 그린다. 공휴일은 날짜만 휴일색이고 이름은 아래 목록 제목에 붙는다. 요일과 날짜는 열 가운데,
 * 고른 날은 옅은 바탕. 고른 날의 일정은 아래 목록(DayAgenda)이 보인다.
 */
export function MonthCompact({ month, today, events, holidays, selected, onSelect }: {
  month: string; today: string; events: readonly CalendarEvent[]; holidays: HolidayNames; selected: string; onSelect: (day: string) => void
}) {
  return (
    <section aria-label={monthTitle(month)} className="shrink-0 border-b">
      <ol aria-hidden className="grid grid-cols-7 border-b px-2">
        {WEEKDAYS.map((name, index) => (
          <li key={name} className={cn("py-2 text-center text-xs leading-normal font-semibold", weekdayTone(index) ?? "text-muted-foreground")}>{name}</li>
        ))}
      </ol>
      <ol className="grid grid-cols-7 px-2 pt-1 pb-2">
        {monthWeeks(month).flat().map(day => {
          const on = events.filter(event => covers(event, day))
          const isSelected = day === selected
          return (
            <li key={day} className="contents">
              <button type="button" aria-pressed={isSelected} aria-current={day === today ? "date" : undefined}
                aria-label={`${dayTitle(day)}${holidaySuffix(day, holidays)}, 일정 ${on.length}개`} onClick={() => onSelect(day)}
                className={cn(
                  "flex h-12 min-w-0 flex-col items-center gap-[3px] rounded-lg pt-1 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  dayTone(day, holidays), day === today && TODAY_HATCH, isSelected && "bg-pressed",
                )}>
                <time dateTime={day} className={cn("text-sm font-semibold tabular-nums", !isSameMonth(day, month) && "opacity-40")}>{dayNumber(day)}</time>
                <span className={cn("flex h-[0.4375rem] items-center gap-0.5", !isSameMonth(day, month) && "opacity-40")}>
                  {on.slice(0, DOTS).map(event => <EventDot key={event.id} category={event.category} />)}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
