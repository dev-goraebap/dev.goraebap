import { Link, Outlet } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { paths } from "@/shared/config"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar"
import { Button } from "@/shared/ui/button"
import { InboxIcon, SearchIcon } from "@/shared/ui/icon"
import { PageChromeProvider } from "@/shared/ui/page"
import { SidebarProvider } from "@/shared/ui/sidebar"
import { me } from "../model/me"
import { AgentBar } from "./AgentBar"
import { AppSidebar } from "./AppSidebar"
import { MeMenu } from "./MeMenu"
import { MobileTabBar } from "./MobileTabBar"

/**
 * 앱 셸(호호코워크 inset 레이아웃). 데스크톱: 바닥(사이드바 색) 위에 사이드바와, 위 · 오른쪽 8px 띄운 초타원 본문 면, 그 아래 Agent 줄.
 * 휴대폰: 사이드바 없이 본문과 하단 탭. 앱 바는 페이지가 그리고, 오른쪽 공통 도구는 여기서 넘긴다.
 */
export function AppShell() {
  const isMobile = useIsMobile()
  const [isFullScreen, setFullScreen] = useState(false)
  const chrome = useMemo(() => ({ tools: <MobileChrome />, setFullScreen }), [])
  return (
    <PageChromeProvider value={chrome}>
      {isMobile ? (
        <div className="flex h-svh flex-col bg-background">
          <main className="flex min-h-0 flex-1 flex-col"><Outlet /></main>
          {!isFullScreen && <MobileTabBar />}
        </div>
      ) : (
        <SidebarProvider className="h-svh min-h-0 bg-sidebar">
          <AppSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <main className="mt-2 mr-2 flex min-h-0 flex-1 flex-col overflow-hidden squircle rounded-surface bg-background shadow-surface">
              <Outlet />
            </main>
            <AgentBar />
          </div>
        </SidebarProvider>
      )}
    </PageChromeProvider>
  )
}

/** 휴대폰 앱 바 오른쪽: 검색 · 알림함 · 내 아바타. */
function MobileChrome() {
  return (
    <>
      <Button variant="ghost" size="icon" aria-label="검색"><SearchIcon /></Button>
      <Button variant="ghost" size="icon" aria-label="알림함" nativeButton={false} render={<Link to={paths.notifications} />}><InboxIcon /></Button>
      <MeMenu trigger={
        <button type="button" aria-label="내 메뉴" className="mx-1">
          <Avatar className="size-8"><AvatarImage src={me.picture} alt="" /><AvatarFallback className="text-xs font-semibold">{me.initials}</AvatarFallback></Avatar>
        </button>
      } />
    </>
  )
}
