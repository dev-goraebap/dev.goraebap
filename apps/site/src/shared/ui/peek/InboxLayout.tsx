import { Link } from "@tanstack/react-router"
import { useState, type ReactNode } from "react"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { Button } from "@/shared/ui/button"
import { ArrowLeftIcon, MaximizeIcon } from "@/shared/ui/icon"
import { PaneResizeHandle } from "@/shared/ui/pane-resize-handle"
import { InboxIllustration, PageState } from "@/shared/ui/page-state"
import { usePeekClose } from "./use-peek-close"

/** 처리 목록의 목록 칸 너비(px): 가장 넓게(최대값으로) 연다. 끌어 줄인 너비는 이 화면에 있는 동안만 남는다. */
const LIST_WIDTH = { min: 288, max: 560 }

/**
 * 처리 목록(받은 요청 · 알림 · 승인 대기)의 두 칸: 왼쪽 목록(288~560px로 끌어 조절)과 오른쪽 상세 칸(InboxPane).
 * 상세 칸은 늘 있고 고른 것이 없으면 고르라는 빈 상태다. 휴대폰은 목록만 보이고 항목은 자기 페이지로 연다.
 */
export function InboxLayout({ list, detail, listLabel = "목록", detailLabel = "내용" }: {
  list: ReactNode; detail: ReactNode; listLabel?: string; detailLabel?: string
}) {
  const isMobile = useIsMobile()
  const [width, setWidth] = useState(LIST_WIDTH.max)
  const resize = (next: number) => setWidth(Math.round(Math.min(LIST_WIDTH.max, Math.max(LIST_WIDTH.min, next))))
  if (isMobile) return <>{list}</>
  return (
    <div data-slot="inbox-layout" className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
      {/* check-ui: allow-style 목록 칸 너비는 사용자가 끌어 정한 값이다. */}
      <section aria-label={listLabel} className="flex min-h-0 max-w-[58%] shrink-0 flex-col" style={{ width: `${width / 16}rem` }}>{list}</section>
      <PaneResizeHandle label={`${listLabel} 너비`} value={width} min={LIST_WIDTH.min} max={LIST_WIDTH.max} onChange={resize} />
      <section aria-label={detailLabel} className="flex min-h-0 min-w-0 flex-1 flex-col">{detail}</section>
    </div>
  )
}

/**
 * 처리 목록의 상세 칸. 줄을 누르면(어디를 눌러도, usePeekRows의 openOnClick) 이 칸에 그 항목이 열린다. 머리에는 ← 닫기
 * (고른 것 없음으로) · 항목 이름 · 페이지로 열기, Esc로도 닫고 닫으면 초점을 그 줄로 돌린다. 고른 것이 없으면 empty의 안내.
 */
export function InboxPane({ id, title, pageHref, onClose, empty, children }: {
  /** 고른 항목. 없으면 빈 상태. */
  id?: string
  title?: string
  pageHref?: string
  onClose: () => void
  /** 고른 것이 없을 때의 안내. 예: { title: "알림을 선택해 주세요" } */
  empty: { title: string; description?: string }
  children?: ReactNode
}) {
  usePeekClose(id, onClose)
  if (!id) {
    return (
      <section aria-label="고른 항목" className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background pt-16">
        <PageState kind="empty" isCompact illustration={<InboxIllustration />} title={empty.title} description={empty.description} />
      </section>
    )
  }
  return (
    <section role="complementary" aria-label={`미리보기: ${title ?? ""}`} className="flex min-h-0 flex-1 flex-col bg-background">
      <header className="flex h-13 shrink-0 items-center gap-1 border-b px-2">
        <Button variant="ghost" size="icon-sm" aria-label="고른 항목 닫기" title="닫기 (Esc)" onClick={onClose}><ArrowLeftIcon /></Button>
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</h2>
        {pageHref && (
          <Button variant="ghost" size="icon-sm" aria-label="페이지로 열기" title="페이지로 열기" nativeButton={false} render={<Link to={pageHref} />}>
            <MaximizeIcon />
          </Button>
        )}
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
    </section>
  )
}
