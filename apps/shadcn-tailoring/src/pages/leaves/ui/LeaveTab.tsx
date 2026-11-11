import { currentMonth, dayText, shortDateText, useLeaveRequests, useLeaveSummary, type LeaveSummary } from "@/entities/leave"
import { PageState } from "@/shared/ui/page-state"
import { SettingsSection } from "@/shared/ui/settings"
import { Skeleton } from "@/shared/ui/skeleton"
import { LeaveMetrics } from "./LeaveMetrics"
import { LeaveRequestList } from "./LeaveRequestList"
import { MonthlyUsage } from "./MonthlyUsage"

/** 내 연차(호호코워크 AnnualSummary): 신청할 수 있는 연차를 크게, 잔여 · 결재 중 · 소멸 예정 · 다음 부여. */
function AnnualSummary({ summary }: { summary: LeaveSummary }) {
  return (
    <LeaveMetrics label="내 연차" items={[
      { label: "신청할 수 있는 연차", value: dayText(summary.available), note: `부여 ${dayText(summary.granted)}` },
      { label: "잔여", value: dayText(summary.remaining), note: `사용 ${dayText(summary.used)}` },
      { label: "결재 중", value: dayText(summary.pending) },
      { label: "소멸 예정", value: summary.expiringDays > 0 ? dayText(summary.expiringDays) : "없음",
        note: summary.expiringDays > 0 ? shortDateText(summary.expiringDate) : undefined },
      { label: "다음 부여", value: `+${dayText(summary.nextGrantDays)}`, note: shortDateText(summary.nextGrantDate) },
    ]} />
  )
}

function Requests() {
  const requests = useLeaveRequests()
  if (requests.isPending) return <Skeleton aria-label="신청 내역을 불러오는 중" className="h-40 w-full" />
  if (!requests.data?.length) {
    return <PageState kind="empty" isCompact title="아직 신청한 휴가가 없습니다" description="신청하기로 첫 휴가를 올려 보세요." />
  }
  return <LeaveRequestList requests={requests.data} />
}

/**
 * 휴가 탭(호호코워크 LeaveTab): 연차 현황, 내 신청 내역(결재 상태), 올해 월별 사용.
 * 호호코워크는 신청 내역을 결재함의 올린 결재에서 보이지만, 이 앱에는 결재함이 없어 여기에 둔다.
 */
export function LeaveTab() {
  const summary = useLeaveSummary()
  const month = currentMonth()
  return (
    <>
      <section aria-label="연차" className="flex flex-col gap-2">
        <h2 className="flex min-h-7 items-center text-sm font-medium text-muted-foreground">연차</h2>
        {summary.data ? <AnnualSummary summary={summary.data} /> : <Skeleton aria-label="연차를 불러오는 중" className="h-24 w-full" />}
      </section>
      <SettingsSection title="신청 내역" note="승인 대기 중인 신청은 결재자가 승인하면 연차에서 빠집니다.">
        <Requests />
      </SettingsSection>
      <MonthlyUsage year={Number(month.slice(0, 4))} thisMonth={Number(month.slice(5))} />
    </>
  )
}
