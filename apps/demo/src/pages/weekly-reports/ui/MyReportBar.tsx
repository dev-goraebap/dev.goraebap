import { ME, ReportStateBadge, dueText, isSubmitted, useMyWeeklyReport, weekName, type ReportState } from "@/entities/weekly-report"
import { Button } from "@/shared/ui/button"
import { PenSquareIcon } from "@/shared/ui/icon"
import { PersonAvatar } from "@/shared/ui/person-avatar"

const ACTION: Record<ReportState, string> = { none: "쓰기", draft: "이어 쓰기", submitted: "고치기", confirmed: "고치기" }

/**
 * 목록 위의 내 보고 줄: 이 주의 내 상태와 마감, 쓰기(이어 쓰기 · 고치기). 제출했으면 내 보고를 열 수도 있다.
 * 줄은 목록과 같은 바탕과 16px 여백, 휴대폰에서는 버튼이 44px.
 */
export function MyReportBar({ week, onWrite, onOpen }: { week: string; onWrite: () => void; onOpen: () => void }) {
  const { data } = useMyWeeklyReport(week)
  if (!data) return null
  const { state } = data.report
  return (
    <section aria-label="내 주간보고" className="flex items-center gap-3 border-b bg-background px-4 py-3 text-sm">
      <PersonAvatar id={ME.id} name={ME.name} className="size-8 max-md:hidden" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="flex min-w-0 items-center gap-2 font-medium">
          <span className="truncate">{weekName(week)} 내 주간보고</span>
          <ReportStateBadge state={state} />
        </p>
        <p className="truncate text-xs text-muted-foreground tabular-nums">마감 {dueText(week)}</p>
      </div>
      {isSubmitted(state) && <Button variant="ghost" onClick={onOpen} className="max-md:h-11">보기</Button>}
      <Button variant="secondary" onClick={onWrite} className="max-md:h-11">
        <PenSquareIcon data-icon="inline-start" />
        {ACTION[state]}
      </Button>
    </section>
  )
}
