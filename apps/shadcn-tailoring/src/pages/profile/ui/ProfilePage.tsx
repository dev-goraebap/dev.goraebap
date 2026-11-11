import { UserIcon } from "@/shared/ui/icon"
import { Page } from "@/shared/ui/page"

/** 내 정보. 화면은 다음 단계에서 채운다. */
export function ProfilePage() {
  return <Page crumbs={[{ label: "내 정보", icon: UserIcon }]}>{null}</Page>
}
