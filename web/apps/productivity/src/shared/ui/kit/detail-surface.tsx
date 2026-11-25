import type { MouseEvent, ReactNode } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useOpenPanel } from "@/shared/lib/panel"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { Dialog, DialogBar, DialogBody, DialogContent } from "@goraebap/ui-react/compact/dialog"
import { PaneFrame } from "@/shared/ui/kit/layout/pane-frame"
import { SplitFocusButton } from "@/shared/ui/kit/layout/split-view"
import { Page, parentCrumb, type Crumb } from "@/shared/ui/kit/layout/page"
import { RowLink } from "@/shared/ui/kit/row-link"

export type DetailSurfaceProps = {
  /**
   * page: 자기 페이지(링크 · 새로고침 · 크게 보기). dialog: 데스크톱에서 목록이 연 대화상자. pane: 데스크톱에서 목록 오른쪽 칸
   * (공지사항 · 회의록, shared/ui/inbox). 휴대폰은 늘 페이지.
   */
  surface: "dialog" | "page" | "pane"
  /** 대화상자 머리의 이름(주간보고 · 공지사항 · 회의록). 페이지는 경로가 이름이다. */
  title: string
  /** 페이지의 경로. */
  crumbs: Crumb[]
  /** 페이지 메뉴(…). 페이지는 머리 줄 끝, 대화상자는 머리의 크게 보기 앞. */
  actions?: ReactNode
  /** 보기 탭(회의록 · 전사원문). 페이지는 툴바, 대화상자는 머리 아래 줄. */
  views?: ReactNode
  onClose?: () => void
  /** 페이지로 열기(↗): 같은 것을 자기 페이지로. 대화상자에만 있다. */
  onExpand?: () => void
  /** 본문(DetailLayout · 읽는 중 · 없음). 대화상자에서는 머리 아래에서 스크롤한다. */
  children: ReactNode
}

/**
 * 상세 하나가 놓이는 곳(cowork DetailSurface). 페이지는 Page(전체 화면 상세: 휴대폰은 앱 바 ← 와 메뉴), 대화상자는
 * 화면 위 12%에서 뜨는 최대 60rem 창으로 머리에 이름 · 메뉴 · 크게 보기 · 닫기, 그 아래 본문이 스크롤한다.
 * 본문의 DetailLayout은 자기 폭으로 모양을 정하므로 대화상자에서도 넓으면 옆 칸, 좁으면 한 줄 알약이 된다.
 */
export function DetailSurface({ surface, title, crumbs, actions, views, onClose, onExpand, children }: DetailSurfaceProps) {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  if (isMobile) {
    return <Page crumbs={crumbs} actions={actions} views={views} isFullScreen>{children}</Page>
  }
  if (surface === "page") {
    // 데스크톱 자기 페이지(2026-11-14): 목록 오른쪽 칸과 같은 틀. 구분선 없는 머리에 둥근 뒤로(경로의 위 단계로) · 도구,
    // 스크롤해 본문 제목이 가려지면 뒤로 단추 옆에 이름이 나타난다.
    const parent = parentCrumb(crumbs)
    return (
      <PaneFrame label={title} title={crumbs[crumbs.length - 1]?.label ?? title} backLabel={parent ? `${parent.label}(으)로` : "뒤로"}
        onBack={() => (parent?.href ? void navigate({ href: parent.href }) : window.history.back())} actions={actions} below={views} isPageHead>
        {children}
      </PaneFrame>
    )
  }
  if (surface === "pane") {
    // 목록 오른쪽 칸: 알림함의 고른 항목(SplitDetail)과 같은 틀(PaneFrame). 둥근 ← 닫기와 메뉴, 스크롤하면 이름(경로의 끝).
    // 보기 탭은 머리 줄 아래에 함께 고정한다.
    return (
      <PaneFrame label={title} title={crumbs[crumbs.length - 1]?.label ?? title} onBack={onClose} backLabel="고른 항목 닫기"
        actions={<>{actions}<SplitFocusButton /></>} below={views}>
        {children}
      </PaneFrame>
    )
  }
  return (
    <Dialog open onOpenChange={isOpen => { if (!isOpen) onClose?.() }}>
      {/* 대화상자 키트의 모양 그대로(45rem · 구분선 없음): 머리 줄에 이름 · 메뉴 · 크게 보기 · 닫기, 보기 탭, 스크롤하는 본문. */}
      <DialogContent showCloseButton={false} className="min-h-[min(24rem,76dvh)]">
        <DialogBar title={title} onExpand={onExpand}>{actions}</DialogBar>
        {views && <div className="-mt-2 flex min-w-0 shrink-0 items-center gap-1.5 overflow-x-auto [scrollbar-width:none]">{views}</div>}
        <DialogBody>{children}</DialogBody>
      </DialogContent>
    </Dialog>
  )
}

/**
 * 상세를 여는 줄 링크(cowork DetailLink, 줄 어디를 눌러도 열린다: RowLink). 그냥 누르면 데스크톱은 목록 위 대화상자,
 * 휴대폰은 그 페이지로 가고, 보조 키를 누르거나 가운데 단추로 누르면 브라우저가 그 주소를 연다(새 탭).
 */
export function DetailLink({ href, title, className, children }: { href: string; title?: string; className?: string; children: ReactNode }) {
  const open = useOpenPanel()
  const click = (event: MouseEvent) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    open(href)
  }
  return <RowLink to={href} title={title} onClick={click} className={className}>{children}</RowLink>
}
