import type { MouseEvent, ReactNode } from "react"
import { useOpenPanel } from "@/shared/lib/panel"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/shared/ui/dialog"
import { MaximizeIcon, XIcon } from "@/shared/ui/icon"
import { Page, type Crumb } from "@/shared/ui/page"
import { RowLink } from "@/shared/ui/row-link"

export type DetailSurfaceProps = {
  /** page: 자기 페이지(링크 · 새로고침 · 크게 보기). dialog: 데스크톱에서 목록이 연 대화상자. 휴대폰은 늘 페이지. */
  surface: "dialog" | "page"
  /** 대화상자 머리의 이름(주간보고 · 공지사항 · 회의록). 페이지는 경로가 이름이다. */
  title: string
  /** 페이지의 경로. */
  crumbs: Crumb[]
  /** 페이지 메뉴(…). 페이지는 머리 줄 끝, 대화상자는 머리의 크게 보기 앞. */
  actions?: ReactNode
  /** 보기 탭(회의록 · 전사원문). 페이지는 툴바, 대화상자는 머리 아래 줄. */
  views?: ReactNode
  onClose?: () => void
  /** 크게 보기: 같은 것을 자기 페이지로. 대화상자에만 있다. */
  onExpand?: () => void
  /** 본문(DetailLayout · 읽는 중 · 없음). 대화상자에서는 머리 아래에서 스크롤한다. */
  children: ReactNode
}

/**
 * 상세 하나가 놓이는 곳(호호코워크 DetailSurface). 페이지는 Page(전체 화면 상세: 휴대폰은 앱 바 ← 와 메뉴), 대화상자는
 * 화면 위 12%에서 뜨는 최대 60rem 창으로 머리에 이름 · 메뉴 · 크게 보기 · 닫기, 그 아래 본문이 스크롤한다.
 * 본문의 DetailLayout은 자기 폭으로 모양을 정하므로 대화상자에서도 넓으면 옆 칸, 좁으면 한 줄 알약이 된다.
 */
export function DetailSurface({ surface, title, crumbs, actions, views, onClose, onExpand, children }: DetailSurfaceProps) {
  const isMobile = useIsMobile()
  if (surface === "page" || isMobile) {
    return <Page crumbs={crumbs} actions={actions} views={views} isFullScreen>{children}</Page>
  }
  return (
    <Dialog open onOpenChange={isOpen => { if (!isOpen) onClose?.() }}>
      <DialogContent showCloseButton={false}
        className="top-[12dvh] flex max-h-[76dvh] min-h-[min(24rem,76dvh)] translate-y-0 flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(60rem,calc(100vw-3rem))]">
        <div className="flex min-w-0 shrink-0 items-center gap-2 border-b px-4 py-2.5">
          <DialogTitle className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</DialogTitle>
          <div className="flex shrink-0 items-center gap-1">
            {actions}
            {onExpand && <Button variant="ghost" size="icon-sm" aria-label="크게 보기" title="크게 보기" onClick={onExpand}><MaximizeIcon /></Button>}
            <DialogClose render={<Button variant="ghost" size="icon-sm" aria-label="닫기" title="닫기" />}><XIcon /></DialogClose>
          </div>
        </div>
        {views && <div className="flex min-w-0 shrink-0 items-center gap-1.5 overflow-x-auto border-b px-4 py-2 [scrollbar-width:none]">{views}</div>}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * 상세를 여는 줄 링크(호호코워크 DetailLink, 줄 어디를 눌러도 열린다: RowLink). 그냥 누르면 데스크톱은 목록 위 대화상자,
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
