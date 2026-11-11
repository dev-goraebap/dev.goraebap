import { dayText, formatDays, scaleTop, useLeaveUsage, type MonthUsage } from "@/entities/leave"
import { cn } from "@/shared/lib/utils"
import { Skeleton } from "@/shared/ui/skeleton"

type Part = "annual" | "other" | "scheduled"

/** 막대 조각의 칠: 연차는 강조색, 그 외 휴가는 파랑 표식, 예정은 빗금. */
const PART_FILL: Record<Part, string> = {
  annual: "bg-primary",
  other: "bg-mark-low",
  scheduled: "bg-muted bg-[repeating-linear-gradient(135deg,var(--muted-foreground)_0_1px,transparent_1px_4px)]",
}
const LEGEND: { part: Part; label: string }[] = [
  { part: "annual", label: "연차 사용" }, { part: "other", label: "그 외 휴가 사용" }, { part: "scheduled", label: "예정" },
]
const PARTS: Part[] = ["annual", "other", "scheduled"]

const percent = (fraction: number) => `${fraction * 100}%`

/** 한 달의 막대: 위에 합계, 아래에서부터 연차 · 그 외 · 예정을 쌓는다. 높이는 데이터 값이다. */
function MonthBar({ column, top, isCurrent }: { column: MonthUsage; top: number; isCurrent: boolean }) {
  const detail = `${column.month}월 연차 ${formatDays(column.annual)}일, 그 외 휴가 ${formatDays(column.other)}일, 예정 ${formatDays(column.scheduled)}일`
  return (
    <li aria-label={detail} className="flex min-w-0 flex-col gap-1">
      <div className="flex h-34 flex-col items-center justify-end gap-1 border-b">
        {column.total > 0 && (
          <>
            <span className="text-[0.6875rem] text-muted-foreground tabular-nums">{formatDays(column.total)}</span>
            {/* check-ui: allow-style 막대 높이는 휴가 일수에서 나온 데이터 값이다. */}
            <div style={{ height: percent((column.total / top) * 0.83) }} className="flex w-full max-w-6 flex-col-reverse overflow-hidden rounded-t-sm">
              {PARTS.filter(part => column[part] > 0).map(part => (
                // check-ui: allow-style 조각 높이는 데이터 값이다.
                <div key={part} style={{ height: percent(column[part] / column.total) }} className={PART_FILL[part]} />
              ))}
            </div>
          </>
        )}
      </div>
      <span className={cn("text-center text-[0.6875rem] text-muted-foreground", isCurrent && "font-semibold text-foreground")}>{column.month}월</span>
    </li>
  )
}

/** 올해 휴가(호호코워크 MonthlyUsage): 합계 범례와 열두 달 막대. 이번 달 이름은 진하게. */
export function MonthlyUsage({ year, thisMonth }: { year: number; thisMonth: number }) {
  const usage = useLeaveUsage(year)
  const columns = usage.data ?? []
  const total = (part: Part) => columns.reduce((sum, column) => sum + column[part], 0)
  const top = scaleTop(columns.map(column => column.total))
  return (
    <section aria-label={`${year}년 휴가`} className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-muted-foreground">{year}년 휴가</h2>
      {usage.isPending ? <Skeleton aria-label="불러오는 중" className="h-44 w-full" /> : (
        <>
          <ul aria-label="휴가 사용 합계" className="flex flex-wrap gap-3">
            {LEGEND.map(item => (
              <li key={item.part} className="flex items-center gap-1 text-xs">
                <span aria-hidden className={cn("size-2.5 rounded-[0.2rem]", PART_FILL[item.part])} />
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium tabular-nums">{dayText(total(item.part))}</span>
              </li>
            ))}
          </ul>
          <ol aria-label="월별 휴가 사용" className="grid grid-cols-12 gap-1">
            {columns.map(column => <MonthBar key={column.month} column={column} top={top} isCurrent={column.month === thisMonth} />)}
          </ol>
        </>
      )}
    </section>
  )
}
