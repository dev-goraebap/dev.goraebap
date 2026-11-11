import { Link } from "@tanstack/react-router"
import { paths } from "@/shared/config"
import { Button } from "@/shared/ui/button"
import { Page } from "@/shared/ui/page"
import { PageState } from "@/shared/ui/page-state"

/** 모르는 주소(호호코워크는 홈으로 보낸다). 여기서는 404 그림과 처음으로 가는 길을 둔다. */
export function NotFoundPage() {
  return (
    <Page crumbs={[{ label: "찾을 수 없음" }]}>
      <PageState kind="not-found" title="페이지를 찾을 수 없습니다" description="주소가 바뀌었거나 없는 페이지입니다."
        action={<Button variant="outline" nativeButton={false} render={<Link to={paths.notifications} />}>알림함으로</Button>} />
    </Page>
  )
}
