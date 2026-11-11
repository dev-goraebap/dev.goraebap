import { useNavigate, useParams } from "@tanstack/react-router"
import type { ReactNode } from "react"
import { useNotifications, useReadAllNotifications, type Notification } from "@/entities/notification"
import { paths } from "@/shared/config"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { useStoredWidth } from "@/shared/lib/use-stored-width"
import { cn } from "@/shared/lib/utils"
import { InboxIllustration, PageState } from "@/shared/ui/page-state"
import { CircleCheckIcon, InboxIcon, SettingsIcon } from "@/shared/ui/icon"
import { ActionMenu } from "@/shared/ui/action-menu"
import { Page, PageViews } from "@/shared/ui/page"
import { PaneResizeHandle } from "@/shared/ui/pane-resize-handle"
import { inboxViews, listHref, useInboxView } from "../model/views"
import { NotificationList } from "./NotificationList"
import { NotificationColumnSkeleton, NotificationPane, NotificationScreen } from "./NotificationDetail"

/**
 * 알림함(/notifications, /notifications/$notificationId). 고른 알림은 주소에, 뷰는 ?view=에 실린다.
 * 데스크톱: 왼쪽 목록 칸(머리 줄 · 뷰 · 따로 스크롤하는 목록, 기본 560px, 구분선을 끌어 조절)과 오른쪽 고른 알림.
 * 휴대폰: 목록만. 고르면 그 알림이 자기 화면이고 ←로 목록에 돌아간다.
 */
export function NotificationsPage() {
  const isMobile = useIsMobile()
  const { notificationId } = useParams({ strict: false })
  const { data: items } = useNotifications()
  const selected = notificationId ? items?.find(item => item.id === notificationId) : undefined

  if (isMobile && notificationId) {
    if (selected) return <NotificationScreen key={selected.id} item={selected} />
    return <Page crumbs={[{ label: "알림함", href: paths.notifications }, { label: "알림" }]}>
      {items ? <MissingEmpty /> : <NotificationColumnSkeleton />}
    </Page>
  }
  const list = <NotificationsList items={items} selectedId={notificationId} />
  if (isMobile) return list
  return (
    <InboxPanes list={list} isDotted={!notificationId}>
      {!notificationId ? <ChooseEmpty />
        : selected ? <NotificationPane key={selected.id} item={selected} />
        : items ? <MissingEmpty /> : <NotificationColumnSkeleton />}
    </InboxPanes>
  )
}

/** 목록 칸: 페이지 머리 줄(알림함 · 메뉴), 뷰(전체 · 결재 · 공지 · 일정), 목록. */
function NotificationsList({ items, selectedId }: { items: Notification[] | undefined; selectedId?: string }) {
  const navigate = useNavigate()
  const view = useInboxView()
  const { mutate: readAll } = useReadAllNotifications()
  const unread = items?.filter(item => item.isUnread).length ?? 0
  return (
    <Page
      crumbs={[{ label: "알림함", icon: InboxIcon }]}
      actions={<ActionMenu label="알림함 메뉴" actions={[
        ...(unread > 0 ? [{ label: `모두 읽음 (${unread})`, icon: CircleCheckIcon, onSelect: () => readAll() }] : []),
        { label: "알림 설정", icon: SettingsIcon, onSelect: () => void navigate({ to: paths.profile }) },
      ]} />}
      views={<PageViews label="알림 뷰" views={inboxViews} value={view} onChange={next => void navigate({ href: listHref(next) })} />}
    >
      <NotificationList items={items} view={view} selectedId={selectedId} />
    </Page>
  )
}

/** 데스크톱의 두 칸: 너비를 조절하는 목록 칸과, 그 머리 줄과 나란한 고른 알림 칸. 두 칸은 따로 스크롤한다. 고른 것이 없으면 오른쪽도 점 무늬 바탕이다. */
/** 목록 칸 너비: 기본이자 최대 560px(호호코워크 LIST_MAX_WIDTH), 최소 288px. */
const LIST_MIN_WIDTH = 288
const LIST_MAX_WIDTH = 560

function InboxPanes({ list, isDotted, children }: { list: ReactNode; isDotted: boolean; children: ReactNode }) {
  const [width, resize] = useStoredWidth({ key: "notifications-list-width", min: LIST_MIN_WIDTH, max: LIST_MAX_WIDTH })
  return (
    <div className="flex min-h-0 flex-1">
      {/* check-ui: allow-style 사용자가 끌어 정한 목록 너비(px)는 데이터 값이다. */}
      <section aria-label="알림함" className="flex max-w-[58%] min-w-0 shrink-0 flex-col" style={{ width }}>{list}</section>
      <PaneResizeHandle label="알림함 목록 너비" value={width} min={LIST_MIN_WIDTH} max={LIST_MAX_WIDTH} onChange={resize} />
      <section aria-label="고른 항목" className={cn("flex min-w-0 flex-1 flex-col", isDotted && "bg-dots")}>{children}</section>
    </div>
  )
}

/** 아무것도 고르지 않았을 때 오른쪽 칸(호호코워크는 편지가 담긴 알림함 그림). */
function ChooseEmpty() {
  return <PageState kind="empty" illustration={<InboxIllustration />} title="알림을 선택해 주세요" description="결재 요청, 공지, 일정의 상세 내용을 여기서 확인할 수 있습니다." />
}

function MissingEmpty() {
  return <PageState kind="not-found" title="알림을 찾을 수 없습니다" description="목록에서 알림을 다시 골라 주세요." />
}
