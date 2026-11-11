import { MeetingIcon } from "@/shared/ui/icon"
import { Page } from "@/shared/ui/page"

/** 회의록. 화면은 다음 단계에서 채운다. */
export function MeetingsPage() {
  return <Page crumbs={[{ label: "회의록", icon: MeetingIcon }]}>{null}</Page>
}
