import { ClockIcon } from "@/shared/ui/icon"
import { Page } from "@/shared/ui/page"

/** 근태 · 휴가. 화면은 다음 단계에서 채운다. */
export function LeavesPage() {
  return <Page crumbs={[{ label: "근태 · 휴가", icon: ClockIcon }]}>{null}</Page>
}
