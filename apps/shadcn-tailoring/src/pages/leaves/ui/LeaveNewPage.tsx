import { ClockIcon } from "@/shared/ui/icon"
import { Page } from "@/shared/ui/page"

/** 휴가 신청. 화면은 다음 단계에서 채운다. */
export function LeaveNewPage() {
  return <Page crumbs={[{ label: "휴가 신청", icon: ClockIcon }]}>{null}</Page>
}
