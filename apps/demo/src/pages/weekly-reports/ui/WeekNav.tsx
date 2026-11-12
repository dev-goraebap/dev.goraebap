import { shiftWeek, weekShortText, weekText } from "@/entities/weekly-report"
import { Button } from "@/shared/ui/button"
import { ChevronLeftIcon, ChevronRightIcon } from "@/shared/ui/icon"

/**
 * 보는 주와 넘기기(일정의 CalendarNav와 같은 줄): 주 이름(11월 9일 ~ 11월 15일, 휴대폰은 11. 9. ~ 11. 15.), 이번 주, 이전 · 다음 꺾쇠.
 * 아직 오지 않은 주의 보고는 없으므로 이번 주에서 다음은 막는다.
 */
export function WeekNav({ week, thisWeek, onChange }: { week: string; thisWeek: string; onChange: (week: string) => void }) {
  const isThisWeek = week === thisWeek
  return (
    <div className="flex items-center gap-1">
      <p aria-live="polite" className="pr-1.5 text-sm font-semibold whitespace-nowrap tabular-nums">
        <span className="max-md:hidden">{weekText(week)}</span>
        <span className="md:hidden">{weekShortText(week)}</span>
      </p>
      <Button variant={isThisWeek ? "view-active" : "view"} aria-pressed={isThisWeek} onClick={() => onChange(thisWeek)}
        className="px-3 max-md:h-11 max-md:px-4">
        이번 주
      </Button>
      <Button variant="view" size="icon" aria-label="이전 주" onClick={() => onChange(shiftWeek(week, -1))} className="max-md:size-11">
        <ChevronLeftIcon className="max-md:size-5" />
      </Button>
      <Button variant="view" size="icon" aria-label="다음 주" disabled={isThisWeek} onClick={() => onChange(shiftWeek(week, 1))} className="max-md:size-11">
        <ChevronRightIcon className="max-md:size-5" />
      </Button>
    </div>
  )
}
