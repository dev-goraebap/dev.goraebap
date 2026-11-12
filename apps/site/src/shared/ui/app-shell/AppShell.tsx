import { useMemo, useState, type CSSProperties, type ReactNode } from "react"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { cn } from "cn"
import { PageChromeProvider } from "@/shared/ui/page"
import { SidebarProvider } from "@/shared/ui/sidebar"
import { TooltipProvider } from "@/shared/ui/tooltip"
import { MeButton, type ShellMe } from "./MeMenu"
import { MobileTabBar } from "./MobileTabBar"
import { currentEntry, type NavEntry, type NavSpace } from "./nav"
import { ShellSidebar, type FoldSlot, type OpenGroups, type ShellLayout } from "./ShellSidebar"
import { SidebarResizeHandle } from "./SidebarResizeHandle"

/** 사이드바 너비(루트 16px 기준 px): 처음과 다시 펼칠 때 initial, 끌어서 min~max(호호코워크 340 · 220~380). */
export type SidebarWidth = { initial: number; min: number; max: number }
const SIDEBAR_WIDTH: SidebarWidth = { initial: 340, min: 220, max: 380 }

export type AppShellProps = {
  /** 지금 주소의 메뉴 한 벌(주 메뉴 또는 하위 공간). 앱이 주소로 고른다. */
  space: NavSpace
  /** 지금 주소. 지금 항목을 찾고, 바뀌면 더보기를 닫는다. */
  pathname: string
  /** 사이드바 머리의 로고 · 이름(홈 링크로 감싸 넘긴다). 접힌 사이드바는 심벌만. */
  brand: FoldSlot
  /** 사이드바 머리 줄 오른쪽 작은 도구(전역 검색). */
  headerTools?: ReactNode
  /** 내 박스 · 아바타와 내 메뉴. 휴대폰은 앱 바 끝의 아바타. */
  me?: ShellMe
  /** 사이드바 바닥 왼쪽(릴리스 · 환경 설정). */
  footer?: FoldSlot
  /** 데스크톱 본문 아래 줄(AgentBar). inset에서는 본문 면 아래, split에서는 본문 아래 끝에 붙는다. */
  bottomBar?: ReactNode
  /** 휴대폰 앱 바 오른쪽 공통 도구(검색 · 알림함). 내 아바타는 me가 있으면 끝에 붙는다. */
  phoneTools?: ReactNode
  /** 휴대폰 하단 탭. 없으면 공간 메뉴의 앞 네 곳(isPhoneHidden 제외). */
  tabs?: NavEntry[]
  /** inset: 바닥 위에 떠 있는 둥근 본문 면. split: 가는 선으로 나눈 평평한 면. */
  layout?: ShellLayout
  openGroups?: OpenGroups
  sidebarWidth?: SidebarWidth
  /** 페이지(라우터의 Outlet). */
  children: ReactNode
}

/**
 * 앱 셸(호호코워크 AppFrame · inset 레이아웃). 메뉴는 데이터(space)로 받고, 로고 · 나 · 도구 · 바닥 줄은 자리로 받는다.
 * - 데스크톱: 끌어 220~380px로 바꾸는 사이드바(접으면 아이콘만, 다시 펼치면 처음 너비)와 본문. inset은 바닥(사이드바 색) 위에
 *   위 · 오른쪽 8px 띄운 초타원 면, split은 선으로 나눈 면이다. Ctrl/⌘+B로도 접는다.
 * - 휴대폰(64rem 미만): 사이드바 없이 본문과 하단 탭(앞 네 곳 + 더보기). 위쪽 52px 앱 바는 Page가 그리고 오른쪽 도구는 여기서 넘긴다.
 *   상세 · 양식 페이지가 전체 화면을 알리면(useFullScreen) 하단 탭을 치운다.
 * 본문의 부모 요소는 분기점 · 배치가 바뀌어도 같은 자리에 같은 종류로 두어, 창을 줄이고 늘려도 작성 중인 페이지가 다시 마운트되지 않는다.
 */
export function AppShell({ space, pathname, brand, headerTools, me, footer, bottomBar, phoneTools, tabs, layout = "inset", openGroups = "all",
  sidebarWidth = SIDEBAR_WIDTH, children }: AppShellProps) {
  const isMobile = useIsMobile()
  const [isFullScreen, setFullScreen] = useState(false)
  const [isOpen, setIsOpen] = useState(true)
  const [width, setWidth] = useState(sidebarWidth.initial)
  const [isResizing, setIsResizing] = useState(false)
  const current = currentEntry(space, pathname)
  const tools = useMemo(() => (phoneTools || me ? <>{phoneTools}{me && <MeButton me={me} className="mx-0.5" />}</> : null), [phoneTools, me])
  const chrome = useMemo(() => ({ tools, setFullScreen }), [tools])
  const open = (next: boolean) => {
    setIsOpen(next)
    if (next) setWidth(sidebarWidth.initial)
  }
  const isInset = layout === "inset"
  return (
    <TooltipProvider>
      <PageChromeProvider value={chrome}>
        {/* check-ui: allow-style 사이드바 너비는 사용자가 끌어 정한 값이다(rem이라 큰 화면의 루트 배율을 따른다). */}
        <SidebarProvider open={isOpen} onOpenChange={open} style={{ "--sidebar-width": `${width / 16}rem` } as CSSProperties}
          // 끄는 동안에는 너비 전환 애니메이션을 끈다(손을 바로 따라가도록).
          className={cn("h-svh min-h-0 overflow-hidden", isMobile || !isInset ? "bg-background" : "bg-sidebar",
            isResizing && "**:data-[slot=sidebar-container]:transition-none **:data-[slot=sidebar-gap]:transition-none")}>
          {!isMobile && <ShellSidebar space={space} current={current} brand={brand} headerTools={headerTools} me={me} footer={footer}
            layout={layout} openGroups={openGroups} />}
          {!isMobile && isOpen && <SidebarResizeHandle value={width} min={sidebarWidth.min} max={sidebarWidth.max} onChange={setWidth}
            onDraggingChange={setIsResizing} />}
          <div className="flex min-w-0 flex-1 flex-col">
            <main className={cn("flex min-h-0 flex-1 flex-col overflow-hidden bg-background",
              isMobile && "pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]",
              !isMobile && isInset && cn("mt-2 mr-2 squircle rounded-surface shadow-surface", !bottomBar && "mb-2"))}>
              {children}
            </main>
            {!isMobile && bottomBar}
            {isMobile && !isFullScreen && <MobileTabBar space={space} current={current} tabs={tabs} pathname={pathname} />}
          </div>
        </SidebarProvider>
      </PageChromeProvider>
    </TooltipProvider>
  )
}
