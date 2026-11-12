import { useRouterState } from "@tanstack/react-router"
import type { Notification, NotificationKind } from "@/entities/notification"
import { paths, projectPath } from "@/shared/config"
import { CalendarIcon, InboxIcon, InboxInIcon, MegaphoneIcon, type Icon } from "@/shared/ui/icon"
import type { PageView } from "@/shared/ui/page"

/** 알림함의 뷰. 업무 멘션은 전체에만 보인다. 고른 뷰는 주소(?view=)에 실린다. */
export type InboxView = "all" | Exclude<NotificationKind, "mention">

export const inboxViews: (PageView<InboxView> & { icon: Icon })[] = [
  { value: "all", label: "전체", icon: InboxIcon },
  { value: "approval", label: "결재", icon: InboxInIcon },
  { value: "notice", label: "공지", icon: MegaphoneIcon },
  { value: "event", label: "일정", icon: CalendarIcon },
]

export const viewOf = (value: InboxView) => inboxViews.find(view => view.value === value) ?? inboxViews[0]

/** 뷰에 아무것도 없을 때의 제목. */
export const emptyTitle: Record<InboxView, string> = {
  all: "새로 확인할 활동이 없습니다",
  approval: "받은 결재 요청이 없습니다",
  notice: "받은 공지가 없습니다",
  event: "일정 알림이 없습니다",
}

/** 주소의 ?view=를 읽는다. 모르는 값은 전체다. */
export function useInboxView(): InboxView {
  const raw = useRouterState({ select: state => new URLSearchParams(state.location.searchStr).get("view") })
  return inboxViews.find(view => view.value === raw)?.value ?? "all"
}

export const isInView = (item: Notification, view: InboxView) => view === "all" || item.kind === view

/** 뷰의 목록 주소. 뷰를 바꾸면 고른 항목은 풀린다. */
export const listHref = (view: InboxView) => (view === "all" ? paths.notifications : `${paths.notifications}?view=${view}`)

/** 알림이 가리키는 것의 단독 페이지("페이지로 열기"). */
export const pageHrefOf: Record<NotificationKind, string> = {
  approval: paths.leaves,
  notice: paths.announcements,
  event: paths.schedule,
  // 목 알림의 언급은 모두 호호코워크(cowork) 프로젝트의 업무에서 온다.
  mention: projectPath("cowork"),
}
