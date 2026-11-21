import { useMemo, useState, type CSSProperties, type ReactNode } from "react"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { cn } from "cn"
import { PageChromeProvider } from "@/shared/ui/kit/layout/page"
import { SidebarProvider, useSidebar } from "@/shared/ui/kit/sidebar"
import { Button } from "@/shared/ui/kit/button"
import { PanelLeftIcon } from "@/shared/ui/kit/icon"
import { TooltipProvider } from "@/shared/ui/kit/tooltip"
import type { ShellMe } from "./MeMenu"
import { MobileTabBar } from "./MobileTabBar"
import { PhoneBar, type PhoneBarProps } from "./PhoneBar"
import { currentEntry, type NavEntry, type NavSpace } from "./nav"
import { ShellSidebar, type FoldSlot, type OpenGroups, type ShellLayout } from "./ShellSidebar"
import { SidebarResizeHandle, type HandleEdge } from "./SidebarResizeHandle"

/** 사이드바 너비(루트 16px 기준 px): 처음과 다시 펼칠 때 initial, 끌어서 min~max(cowork 340 · 220~380). */
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
  /** 데스크톱 맨 위 머리 줄. 주면 로고 · 내 메뉴가 사이드바에서 이 줄로 올라가고, 사이드바는 그 아래에 선다. */
  /** 사이드바 머리 아래에 내 박스를 둔다(기본). 앱이 머리 도구(headerTools)에 내 아바타를 따로 두면 false. */
  hasMeBox?: boolean
  /** 메뉴 아래 "관리" 묶음의 항목: 그 공간의 관리 화면처럼 권한이 있을 때만 주는 것(다른 공간으로 옮겨 간다). */
  adminEntries?: NavEntry[]
  /** 휴대폰 하단을 Linear 모바일의 떠 있는 유리 막대(앞 칸 고정 + 메뉴 시트 칸 + 검색 원)로 둔다. 주지 않으면 하단 탭. */
  phoneBar?: Omit<PhoneBarProps, "current" | "pathname">
  /** 페이지(라우터의 Outlet). */
  children: ReactNode
}

/**
 * 앱 셸(cowork AppFrame · inset 레이아웃). 메뉴는 데이터(space)로 받고, 로고 · 나 · 도구 · 바닥 줄은 자리로 받는다.
 * - 데스크톱: 끌어 220~380px로 바꾸는 사이드바(접으면 아이콘만, 다시 펼치면 처음 너비)와 본문. inset은 바닥(사이드바 색) 위에
 *   위 · 오른쪽 8px 띄운 초타원 면, split은 선으로 나눈 면이다. Ctrl/⌘+B로도 접는다.
 * - 휴대폰(64rem 미만): 사이드바 없이 본문과 하단 탭(앞 네 곳 + 더보기). 위쪽 52px 앱 바는 Page가 그리고 오른쪽 도구는 여기서 넘긴다.
 *   상세 · 양식 페이지가 전체 화면을 알리면(useFullScreen) 하단 탭을 치운다.
 * 본문의 부모 요소는 분기점 · 배치가 바뀌어도 같은 자리에 같은 종류로 두어, 창을 줄이고 늘려도 작성 중인 페이지가 다시 마운트되지 않는다.
 */
export function AppShell({ space, pathname, brand, headerTools, me, footer, bottomBar, phoneTools, tabs, layout = "inset", openGroups = "all",
  sidebarWidth = SIDEBAR_WIDTH, hasMeBox = true, adminEntries, phoneBar, children }: AppShellProps) {
  const isMobile = useIsMobile()
  const [isFullScreen, setFullScreen] = useState(false)
  const [isOpen, setIsOpen] = useState(true)
  const [width, setWidth] = useState(sidebarWidth.initial)
  const [isResizing, setIsResizing] = useState(false)
  const [edge, setEdge] = useState<HandleEdge>("idle")
  const current = currentEntry(space, pathname)
  // 휴대폰 앱 바에는 내 사진을 두지 않는다(2026-11-14). 내 메뉴는 하단 막대의 메뉴 시트 머리에 있다(PhoneBar).
  const tools = useMemo(() => phoneTools ?? null, [phoneTools])
  // 사이드바 접기는 본문 머리 줄 맨 왼쪽(페이지 머리 · 상세 페이지 머리)에 고정한다(2026-11-15).
  const sidebarToggle = useMemo(() => (!isMobile ? <SidebarToggle /> : null), [isMobile])
  const chrome = useMemo(() => ({ tools, setFullScreen, sidebarToggle }), [tools, sidebarToggle])
  const open = (next: boolean) => {
    setIsOpen(next)
    if (next) setWidth(sidebarWidth.initial)
  }
  const isInset = layout === "inset"
  const hasPhoneBar = !!phoneBar && isMobile && !isFullScreen
  // 데스크톱 아래 줄(에이전트 줄, 40px)은 화면 폭 전체에 깔리고, 사이드바와 본문 면은 그 위에서 같은 높이로 끝난다.
  const hasBottomBar = !!bottomBar && !isMobile
  return (
    <TooltipProvider>
      <PageChromeProvider value={chrome}>
        {/* check-ui: allow-style 사이드바 너비는 사용자가 끌어 정한 값이다(rem이라 큰 화면의 루트 배율을 따른다). */}
        <SidebarProvider open={isOpen} onOpenChange={open} style={{ "--sidebar-width": `${width / 16}rem`,
          // 휴대폰 유리 막대 몫: 막대(56px) + 아래 띄움(12px) + 홈 표시줄 + 4px. 페이지 본문 · 바닥 줄 · FAB가 이만큼 비운다.
          ...(hasPhoneBar ? { "--phone-bar-space": "calc(4.5rem + env(safe-area-inset-bottom))" } : {}) } as CSSProperties}
          // 끄는 동안에는 너비 전환 애니메이션을 끈다(손을 바로 따라가도록).
          className={cn("h-svh min-h-0 overflow-hidden", isMobile || !isInset ? "bg-background" : "bg-sidebar",
            isResizing && "**:data-[slot=sidebar-container]:transition-none **:data-[slot=sidebar-gap]:transition-none **:data-[slot=shell-brand]:transition-none")}>
          {!isMobile && <ShellSidebar space={space} current={current} brand={brand}
            headerTools={headerTools} me={hasMeBox ? me : undefined} footer={footer} adminEntries={adminEntries}
            layout={layout} openGroups={openGroups} isAboveBar={hasBottomBar} />}
          {!isMobile && isOpen && <SidebarResizeHandle value={width} min={sidebarWidth.min} max={sidebarWidth.max} onChange={setWidth}
            onDraggingChange={setIsResizing} onEdgeChange={isInset ? setEdge : undefined} />}
          <div className={cn("flex min-w-0 flex-1 flex-col", hasBottomBar && "pb-10")}>
            {/* inset: 너비 손잡이를 가리키거나 끌 때 본문 면의 왼쪽 가장자리가 선다(면의 둥근 모서리를 따라 잘린다). */}
            <main data-edge={!isMobile && isInset && isOpen ? edge : undefined}
              className={cn("relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background",
              "before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:z-50 before:w-0 before:bg-transparent before:transition-[width,background-color]",
              "data-[edge=hover]:before:w-0.5 data-[edge=hover]:before:bg-border data-[edge=active]:before:w-1 data-[edge=active]:before:bg-ring",
              isMobile && "pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]",
              // 본문 면의 모서리는 초타원(2026-11-15): 같은 반지름이면 덜 둥글어 보여 1.5배로 깎는다(지원하지 않는 브라우저는 둥근 모서리).
              !isMobile && isInset && cn("mt-2 mr-2 squircle rounded-[calc(var(--radius-surface)*1.5)] shadow-surface", !hasBottomBar && "mb-2"))}>
              {children}
            </main>
            {hasBottomBar && <div data-slot="shell-bottom-bar" className={cn("fixed inset-x-0 bottom-0 z-10", !isInset && "border-t bg-background")}>{bottomBar}</div>}
            {hasPhoneBar && <PhoneBar {...phoneBar} me={me} current={current} pathname={pathname} />}
            {isMobile && !isFullScreen && !phoneBar && <MobileTabBar space={space} current={current} tabs={tabs} pathname={pathname} />}
          </div>
        </SidebarProvider>
      </PageChromeProvider>
    </TooltipProvider>
  )
}

/** 사이드바 접기 · 펴기 단추. 본문 머리 줄 맨 왼쪽에 선다(Page · PaneFrame이 chrome에서 받아 둔다). */
function SidebarToggle() {
  const { state, toggleSidebar } = useSidebar()
  const isFolded = state === "collapsed"
  const foldLabel = isFolded ? "사이드바 펼치기" : "사이드바 접기"
  return (
    <Button variant="ghost" size="icon-sm" aria-label={foldLabel} aria-expanded={!isFolded} title={`${foldLabel} (Ctrl+B)`} onClick={toggleSidebar}
      className="-ml-1 shrink-0 text-muted-foreground hover:text-foreground">
      {/* 사이드바 그림(PanelLeft): 펼친 동안은 채운 모양, 접힌 동안은 선 모양. */}
      <PanelLeftIcon chosen={!isFolded} />
    </Button>
  )
}

