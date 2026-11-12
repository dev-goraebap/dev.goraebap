import { Page } from "@/shared/ui/page"
import { PageState } from "@/shared/ui/page-state"

/** 새 회의록(자리만 잡은 페이지). */
export function MeetingCreatePage() {
  return (
    <Page crumbs={[{ label: "새 회의록" }]} isFullScreen>
      <PageState kind="empty" title="새 회의록을 준비하고 있습니다" />
    </Page>
  )
}
