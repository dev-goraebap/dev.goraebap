import { covers, dayNumber, dayTitle, weekdayOf, WEEKDAYS, type CalendarEvent } from "@/entities/event"
import { cn } from "@/shared/lib/utils"
import { dayTone, holidaySuffix, type HolidayNames } from "./day-style"

/** 휴대폰 주간의 요일 칩 줄: 요일과 날짜(일요일 · 공휴일은 휴일색), 고른 날은 눌린 바탕, 오늘 날짜는 강조 원, 일정이 있는 날은 아래 점. */
export function DayChips({ days, today, selected, events, holidays, onSelect }: {
  days: string[]; today: string; selected: string; events: readonly CalendarEvent[]; holidays: HolidayNames; onSelect: (day: string) => void
}) {
  return (
    <nav aria-label="요일" className="grid shrink-0 grid-cols-7 gap-1 border-b px-3 py-2">
      {days.map(day => {
        const count = events.filter(event => covers(event, day)).length
        const isSelected = day === selected
        return (
          <button key={day} type="button" aria-pressed={isSelected} aria-current={day === today ? "date" : undefined}
            aria-label={`${dayTitle(day)}${holidaySuffix(day, holidays)}, 일정 ${count}개`} onClick={() => onSelect(day)}
            className={cn(
              "relative flex min-w-0 flex-col items-center gap-0.5 rounded-lg pt-1.5 pb-2 outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isSelected ? "bg-muted text-foreground" : dayTone(day, holidays) ?? "text-muted-foreground",
            )}>
            <span className="text-xs">{WEEKDAYS[weekdayOf(day)]}</span>
            <time dateTime={day} className={cn("grid size-7 place-items-center rounded-full text-base font-semibold tabular-nums", day === today && "bg-primary text-primary-foreground")}>
              {dayNumber(day)}
            </time>
            {count > 0 && <span aria-hidden className="absolute bottom-1 size-1 rounded-full bg-icon-muted" />}
          </button>
        )
      })}
    </nav>
  )
}
