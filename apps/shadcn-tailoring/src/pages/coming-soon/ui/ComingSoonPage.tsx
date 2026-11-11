import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty"
import { ClockIcon, type Icon } from "@/shared/ui/icon"
import { Page } from "@/shared/ui/page"

/** 아직 만들지 않은 메뉴의 자리: 머리 줄과 "옮기는 중" 상태(호호코워크 pages/coming-soon). */
export function ComingSoonPage({ title, icon }: { title: string; icon?: Icon }) {
  return (
    <Page crumbs={[{ label: title, icon }]}>
      <Empty className="flex-1">
        <EmptyHeader>
          <EmptyMedia variant="icon"><ClockIcon /></EmptyMedia>
          <EmptyTitle>옮기는 중입니다</EmptyTitle>
          <EmptyDescription>{title} 화면은 아직 이 앱에 옮기지 않았습니다.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </Page>
  )
}
