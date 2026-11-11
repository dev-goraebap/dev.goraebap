import { FileTextIcon } from "@/shared/ui/icon"
import { Page } from "@/shared/ui/page"

/** 주간보고. 화면은 다음 단계에서 채운다. */
export function WeeklyReportsPage() {
  return <Page crumbs={[{ label: "주간보고", icon: FileTextIcon }]}>{null}</Page>
}
