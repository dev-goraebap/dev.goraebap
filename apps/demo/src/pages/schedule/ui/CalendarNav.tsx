import { monthTitle } from "@/entities/event"
import { Button } from "@/shared/ui/button"
import { ChevronLeftIcon, ChevronRightIcon } from "@/shared/ui/icon"

/**
 * 달력의 자리와 넘기기(호호코워크 CalendarNav): 달 제목(2026년 11월), 오늘, 이전 · 다음 꺾쇠 한 쌍.
 * 월간은 달, 주간은 주 단위로 넘긴다. 데스크톱은 ← → T 키로도.
 */
export function CalendarNav({ day, unit, onToday, onStep }: { day: string; unit: "달" | "주"; onToday: () => void; onStep: (by: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <p aria-live="polite" className="pr-1.5 text-sm font-semibold whitespace-nowrap tabular-nums md:w-[7em]">{monthTitle(day)}</p>
      <Button variant="view" title="오늘 (T)" onClick={onToday} className="px-3 max-md:h-11 max-md:px-4">오늘</Button>
      <Button variant="view" size="icon" aria-label={`이전 ${unit}`} title={`이전 ${unit} (←)`} onClick={() => onStep(-1)} className="max-md:size-11">
        <ChevronLeftIcon className="max-md:size-5" />
      </Button>
      <Button variant="view" size="icon" aria-label={`다음 ${unit}`} title={`다음 ${unit} (→)`} onClick={() => onStep(1)} className="max-md:size-11">
        <ChevronRightIcon className="max-md:size-5" />
      </Button>
    </div>
  )
}
