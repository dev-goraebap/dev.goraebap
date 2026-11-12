import { Page } from "@/shared/ui/page"
import { PageState } from "@/shared/ui/page-state"

/** 주간보고(자리만 잡은 페이지). */
export function WeeklyReportPage() {
  return (
    <Page crumbs={[{ label: "주간보고" }]} isFullScreen>
      <PageState kind="empty" title="주간보고을 준비하고 있습니다" />
    </Page>
  )
}
