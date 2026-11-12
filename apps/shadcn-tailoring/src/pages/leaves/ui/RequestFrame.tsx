import type { ReactNode } from "react"
import { paths } from "@/shared/config"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { ClockIcon } from "@/shared/ui/icon"
import { Page } from "@/shared/ui/page"

const DESCRIPTION = "신청한 뒤의 진행 상황은 근태 · 휴가의 신청 내역에서 확인합니다."

/**
 * 새 신청의 틀(호호코워크 DetailSurface variant="settings"). 데스크톱은 경로(근태 · 휴가 › 이름) 아래 45rem 단에 이름 · 안내 ·
 * 본문 · 동작 줄. 휴대폰은 하단 탭 없는 전체 화면: 앱 바(← · 이름), 스크롤하는 본문, 바닥에 고정한 동작 줄.
 */
export function RequestFrame({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  const isMobile = useIsMobile()
  const crumbs = [{ label: "근태 · 휴가", href: paths.leaves }, { label: title, icon: ClockIcon }]
  if (isMobile) {
    return (
      <Page crumbs={crumbs} isFullScreen>
        <div className="flex min-h-0 flex-1 flex-col bg-background">
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-4 py-5">
            <p className="text-sm text-muted-foreground">{DESCRIPTION}</p>
            {children}
          </div>
          {actions && (
            <footer className="flex shrink-0 items-center gap-2 border-t px-4 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">{actions}</footer>
          )}
        </div>
      </Page>
    )
  }
  return (
    <Page crumbs={crumbs}>
      <div className="flex flex-1 justify-center bg-background px-4 py-8">
        <div className="flex w-full max-w-180 min-w-0 flex-col gap-6">
          <header className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-muted-foreground">{DESCRIPTION}</p>
          </header>
          {children}
          {actions && <div className="flex flex-wrap items-center gap-2 pt-2">{actions}</div>}
        </div>
      </div>
    </Page>
  )
}
