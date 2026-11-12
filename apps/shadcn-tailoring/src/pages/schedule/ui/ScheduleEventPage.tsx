import { Page } from "@/shared/ui/page"
import { PageState } from "@/shared/ui/page-state"

/** 일정(자리만 잡은 페이지). */
export function ScheduleEventPage() {
  return (
    <Page crumbs={[{ label: "일정" }]} isFullScreen>
      <PageState kind="empty" title="일정을 준비하고 있습니다" />
    </Page>
  )
}
