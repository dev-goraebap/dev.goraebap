import { KanbanSquareIcon } from "@/shared/ui/icon"
import { Page } from "@/shared/ui/page"

/** 새 업무. 화면은 다음 단계에서 채운다. */
export function WorkItemNewPage() {
  return <Page crumbs={[{ label: "새 업무", icon: KanbanSquareIcon }]}>{null}</Page>
}
