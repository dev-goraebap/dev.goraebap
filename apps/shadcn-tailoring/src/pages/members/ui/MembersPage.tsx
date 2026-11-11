import { UsersIcon } from "@/shared/ui/icon"
import { Page } from "@/shared/ui/page"

/** 구성원. 화면은 다음 단계에서 채운다. */
export function MembersPage() {
  return <Page crumbs={[{ label: "구성원", icon: UsersIcon }]}>{null}</Page>
}
