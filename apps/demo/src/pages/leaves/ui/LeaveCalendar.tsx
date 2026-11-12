import { useState } from "react"
import { ko } from "react-day-picker/locale/ko"
import { holidaysInMonth, type Holiday } from "@/entities/holiday"
import { isoOf } from "@/entities/leave"
import { Calendar } from "@/shared/ui/calendar"

const toDate = (iso: string) => new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)))

/**
 * 휴가 날짜 달력(호호코워크 LeaveDateStep의 Calendar). 고를 수 있는 날(isOpen)만 눌리고, 일요일 · 공휴일은 빨간 날짜로,
 * 아래에 그 달의 공휴일을 적는다. range면 첫날과 마지막 날을 차례로 누르고(하루면 같은 날을 두 번), 둘째 날에서 onPick이
 * 불린다. 첫날보다 앞을 누르면 그날부터 시작한다. single이면 한 번에 고른다.
 */
export function LeaveCalendar({ mode, start, end, min, max, holidays, isOpen, onPick }: {
  mode: "range" | "single"
  start?: string
  end?: string
  min: string
  max: string
  holidays: readonly Holiday[]
  isOpen: (iso: string) => boolean
  onPick: (start: string, end: string) => void
}) {
  const [anchor, setAnchor] = useState<string>()
  const [month, setMonth] = useState(() => toDate(start ?? min))
  const holidayDates = holidays.map(holiday => toDate(holiday.date))
  const shown = holidaysInMonth(holidays, isoOf(month))
  const range = anchor ? { from: toDate(anchor), to: undefined } : start ? { from: toDate(start), to: toDate(end ?? start) } : undefined
  const pick = (day: Date) => {
    const iso = isoOf(day)
    if (mode === "single") return onPick(iso, iso)
    if (!anchor || iso < anchor) return setAnchor(iso)
    setAnchor(undefined)
    onPick(anchor, iso)
  }
  return (
    <div className="flex flex-col items-center gap-2 p-1.5">
      <Calendar mode="range" locale={ko} weekStartsOn={0} month={month} onMonthChange={setMonth}
        startMonth={toDate(min)} endMonth={toDate(max)} selected={range} onSelect={(_, day) => pick(day)}
        disabled={[{ before: toDate(min) }, { after: toDate(max) }, (date: Date) => !isOpen(isoOf(date))]}
        modifiers={{ off: [{ dayOfWeek: [0] }, ...holidayDates] }}
        modifiersClassNames={{ off: "[&>button]:text-day-off" }}
        className="bg-transparent p-0 max-md:[--cell-size:--spacing(11)]" />
      <p className="max-w-72 text-center text-xs text-muted-foreground">
        {mode === "range" ? (anchor ? "마지막 날을 누르세요." : "하루면 그날을 두 번, 여러 날이면 첫날과 마지막 날을 누르세요.") : "쉴 날을 누르세요."}
      </p>
      {shown.length > 0 && (
        <p className="max-w-72 text-center text-xs text-muted-foreground">
          공휴일 · {shown.map(holiday => `${Number(holiday.date.slice(8))}일 ${holiday.name}`).join(", ")}
        </p>
      )}
    </div>
  )
}
