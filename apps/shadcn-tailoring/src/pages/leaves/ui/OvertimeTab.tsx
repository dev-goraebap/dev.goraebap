import { useMemo } from "react"
import { closedDays, useHolidays } from "@/entities/holiday"
import { dateText, durationText, LeaveStatusBadge, monthTitle, useAttendance, type AttendanceDay } from "@/entities/leave"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/shared/ui/item"
import { PageState } from "@/shared/ui/page-state"
import { SettingsSection } from "@/shared/ui/settings"
import { Skeleton } from "@/shared/ui/skeleton"
import { LeaveMetrics } from "./LeaveMetrics"

const sumMinutes = (days: AttendanceDay[]) => days.reduce((total, day) => total + day.overtimeMinutes, 0)

/** 하루(호호코워크 OvertimeDayRows): 결재 상태, 날짜와 출퇴근 · 사유, 끝에 인정 시간. */
function OvertimeDayItem({ day }: { day: AttendanceDay }) {
  return (
    <Item role="listitem" className="rounded-none max-md:py-3.5">
      {day.overtimeStatus && <ItemMedia><LeaveStatusBadge status={day.overtimeStatus} /></ItemMedia>}
      <ItemContent className="min-w-0">
        <ItemTitle>{dateText(day.date)}</ItemTitle>
        <ItemDescription className="line-clamp-1 tabular-nums">
          출근 {day.clockIn} · 퇴근 {day.clockOut}{day.overtimeReason && ` · ${day.overtimeReason}`}
        </ItemDescription>
      </ItemContent>
      <ItemActions><span className="font-semibold tabular-nums">{durationText(day.overtimeMinutes)}</span></ItemActions>
    </Item>
  )
}

/**
 * 한 달의 연장근무(호호코워크 OvertimeTab): 승인된 시간 · 결재 중 · 기록한 날, 그 아래 날짜별 기록.
 * 출퇴근 기록 중 연장근무가 있는 날만 줄로 보이고, 줄에 그날의 출퇴근 시각을 함께 적는다.
 */
export function OvertimeTab({ month }: { month: string }) {
  const { data: holidays } = useHolidays()
  const closed = useMemo(() => closedDays(holidays ?? []), [holidays])
  const attendance = useAttendance(month, closed)
  const days = (attendance.data ?? []).filter(day => day.overtimeMinutes > 0)
  const inReview = sumMinutes(days.filter(day => day.overtimeStatus === "pending"))
  return (
    <>
      <section aria-label={`${monthTitle(month)} 연장근무`} className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">{monthTitle(month)} 연장근무</h2>
        {attendance.isPending ? <Skeleton aria-label="연장근무를 불러오는 중" className="h-20 w-full" /> : (
          <>
            <LeaveMetrics label="이달 연장근무" items={[
              { label: "승인된 연장근무", value: durationText(sumMinutes(days.filter(day => day.overtimeStatus === "approved"))) },
              { label: "결재 중", value: inReview > 0 ? durationText(inReview) : "없음" },
              { label: "기록한 날", value: `${days.length}일`, note: `출근한 날 ${attendance.data?.length ?? 0}일` },
            ]} />
            <p className="text-sm text-muted-foreground">승인된 기록만 합칩니다. 반려된 기록은 새로 신청해 다시 올립니다.</p>
          </>
        )}
      </section>
      {attendance.data && (
        <SettingsSection title="날짜별 기록">
          {days.length === 0
            ? <PageState kind="empty" isCompact title="이 달에는 기록한 연장근무가 없습니다" description="연장근무는 18시 이후 한 시간 넘게 일한 날 남습니다." />
            : <ItemGroup aria-label="날짜별 연장근무" className="gap-0 divide-y">{days.map(day => <OvertimeDayItem key={day.date} day={day} />)}</ItemGroup>}
        </SettingsSection>
      )}
    </>
  )
}
