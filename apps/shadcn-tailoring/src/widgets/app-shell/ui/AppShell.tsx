import { Link, Outlet, useNavigate } from "@tanstack/react-router"
import { useEffect, useMemo, useState, type ComponentType, type CSSProperties } from "react"
import { paths } from "@/shared/config"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { cn } from "@/shared/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar"
import { Button } from "@/shared/ui/button"
import { InboxIcon, SearchIcon } from "@/shared/ui/icon"
import { PageChromeProvider } from "@/shared/ui/page"
import { SidebarProvider } from "@/shared/ui/sidebar"
import { useMe } from "../model/me"
import { AgentBar } from "./AgentBar"
import { AppSidebar } from "./AppSidebar"
import { MeMenu } from "./MeMenu"
import { MobileTabBar } from "./MobileTabBar"
import { SidebarResizeHandle } from "./SidebarResizeHandle"

/** 사이드바 너비(px): 처음과 펼칠 때 340, 끌어서 220~380. 저장하지 않는다(호호코워크). */
const SIDEBAR_WIDTH = { initial: 340, min: 220, max: 380 }

/**
 * 앱 셸(호호코워크 inset 레이아웃). 데스크톱: 바닥(사이드바 색) 위에 사이드바와, 위 · 오른쪽 8px 띄운 초타원 본문 면, 그 아래 Agent 줄.
 * 휴대폰: 사이드바 없이 본문과 하단 탭. 앱 바는 페이지가 그리고, 오른쪽 공통 도구는 여기서 넘긴다.
 * 전역 검색은 사이드바 검색 · 휴대폰 앱 바 돋보기 · Ctrl/⌘+K로 연다. 데스크톱은 search(대화상자), 휴대폰은 /search 페이지.
 */
export function AppShell({ search: SearchDialog }: { search: ComponentType<{ onClose: () => void }> }) {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const [isFullScreen, setFullScreen] = useState(false)
  const [isSearchOpen, setSearchOpen] = useState(false)
  const chrome = useMemo(() => ({ tools: <MobileChrome />, setFullScreen }), [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey)) return
      event.preventDefault()
      if (isMobile) void navigate({ to: paths.search })
      else setSearchOpen(true)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isMobile, navigate])

  return (
    <PageChromeProvider value={chrome}>
      {isMobile ? (
        <div className="flex h-svh flex-col bg-background">
          <main className="flex min-h-0 flex-1 flex-col"><Outlet /></main>
          {!isFullScreen && <MobileTabBar />}
        </div>
      ) : (
        <DesktopShell onSearch={() => setSearchOpen(true)} />
      )}
      {isSearchOpen && !isMobile && <SearchDialog onClose={() => setSearchOpen(false)} />}
    </PageChromeProvider>
  )
}

/** 데스크톱: 끌어서 너비를 바꾸는 사이드바와 inset 본문. 접었다 펼치면 너비가 처음 값으로 돌아간다. */
function DesktopShell({ onSearch }: { onSearch: () => void }) {
  const [isOpen, setIsOpen] = useState(true)
  const [width, setWidth] = useState(SIDEBAR_WIDTH.initial)
  const [isResizing, setIsResizing] = useState(false)
  const open = (next: boolean) => {
    setIsOpen(next)
    if (next) setWidth(SIDEBAR_WIDTH.initial)
  }
  return (
    // check-ui: allow-style 사이드바 너비는 사용자가 끌어 정한 값이다.
    <SidebarProvider open={isOpen} onOpenChange={open} style={{ "--sidebar-width": `${width}px` } as CSSProperties}
      // 끄는 동안에는 너비 전환 애니메이션을 끈다(손을 바로 따라가도록).
      className={cn("h-svh min-h-0 bg-sidebar", isResizing && "**:data-[slot=sidebar-container]:transition-none **:data-[slot=sidebar-gap]:transition-none")}>
      <AppSidebar onSearch={onSearch} />
      {isOpen && (
        <SidebarResizeHandle value={width} min={SIDEBAR_WIDTH.min} max={SIDEBAR_WIDTH.max} onChange={setWidth} onDraggingChange={setIsResizing} />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mt-2 mr-2 flex min-h-0 flex-1 flex-col overflow-hidden squircle rounded-surface bg-background shadow-surface">
          <Outlet />
        </main>
        <AgentBar />
      </div>
    </SidebarProvider>
  )
}

/** 휴대폰 앱 바 오른쪽: 검색 · 알림함 · 내 아바타. */
function MobileChrome() {
  const me = useMe()
  return (
    <>
      <Button variant="ghost" size="icon" aria-label="검색" nativeButton={false} render={<Link to={paths.search} />}><SearchIcon /></Button>
      <Button variant="ghost" size="icon" aria-label="알림함" nativeButton={false} render={<Link to={paths.notifications} />}><InboxIcon /></Button>
      <MeMenu trigger={
        <button type="button" aria-label="내 메뉴" className="mx-1">
          <Avatar className="size-8">
            {me && <AvatarImage src={me.picture} alt="" />}
            <AvatarFallback className="text-xs font-semibold">{me?.initials}</AvatarFallback>
          </Avatar>
        </button>
      } />
    </>
  )
}
