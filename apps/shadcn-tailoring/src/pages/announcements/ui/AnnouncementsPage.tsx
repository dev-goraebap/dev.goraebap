import { MegaphoneIcon } from "@/shared/ui/icon"
import { Page } from "@/shared/ui/page"

/** 공지사항. 화면은 다음 단계에서 채운다. */
export function AnnouncementsPage() {
  return <Page crumbs={[{ label: "공지사항", icon: MegaphoneIcon }]}>{null}</Page>
}
