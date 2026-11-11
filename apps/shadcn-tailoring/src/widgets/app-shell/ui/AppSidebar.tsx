import { Link, useRouterState } from "@tanstack/react-router"
import { Avatar, AvatarFallback } from "@/shared/ui/avatar"
import { Button } from "@/shared/ui/button"
import { ArrowLeftIcon, ChevronsLeftIcon, ChevronsRightIcon, MoreVerticalIcon, SearchIcon } from "@/shared/ui/icon"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarSeparator, useSidebar,
} from "@/shared/ui/sidebar"
import { me } from "../model/me"
import { currentEntry, spaceOf } from "../model/nav"
import { Brand } from "./Brand"
import { MeMenu } from "./MeMenu"

const VERSION = "v0.1.0"

/**
 * 데스크톱 사이드바(호호코워크 AppFrame). 머리: 로고 · 검색, 그 아래 내 박스. 몸: 주소가 속한 메뉴 구역.
 * 바닥: 릴리스와 접기. 접으면 아이콘만 남고 구역 사이를 가는 선으로 나눈다.
 */
export function AppSidebar() {
  const pathname = useRouterState({ select: state => state.location.pathname })
  const { state, toggleSidebar } = useSidebar()
  const isFolded = state === "collapsed"
  const space = spaceOf(pathname)
  const current = currentEntry(space, pathname)
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="gap-3 px-3 pt-3 group-data-[collapsible=icon]:px-2">
        <div className="flex h-8 items-center justify-between group-data-[collapsible=icon]:h-auto group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2">
          <Link to={space.sections[0].entries[0].path} aria-label="처음으로"><Brand isFolded={isFolded} /></Link>
          <Button variant="ghost" size="icon-sm" aria-label="검색"><SearchIcon /></Button>
        </div>
        {isFolded ? (
          <MeMenu trigger={<button type="button" aria-label="내 메뉴" className="mx-auto"><MeAvatar /></button>} />
        ) : (
          <MeMenu trigger={
            <button type="button" className="flex w-full items-center gap-2.5 squircle rounded-xl bg-pressed px-2.5 py-2 text-left hover:bg-[color-mix(in_srgb,var(--foreground)_10%,transparent)]">
              <MeAvatar />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold">{me.name}</span>
                <span className="truncate text-xs text-muted-foreground">{me.team}</span>
              </span>
              <MoreVerticalIcon className="rotate-90 text-icon-muted" />
            </button>
          } />
        )}
      </SidebarHeader>
      <SidebarContent className="px-1">
        {space.back && (
          <SidebarGroup className="py-1">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={space.back.label} render={<Link to={space.back.path} />} className="font-semibold">
                  <ArrowLeftIcon />
                  <span>{space.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}
        {space.sections.map((section, index) => (
          <SidebarGroup key={section.title} className="py-1">
            {isFolded && index > 0 && <SidebarSeparator className="mx-2 mb-1" />}
            {!section.isHeaderHidden && <SidebarGroupLabel>{section.title}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {section.entries.map(entry => {
                  const isCurrent = entry === current
                  return (
                    <SidebarMenuItem key={entry.path}>
                      <SidebarMenuButton isActive={isCurrent} tooltip={entry.label} render={<Link to={entry.path} />}>
                        <entry.icon chosen={isCurrent} />
                        <span>{entry.label}</span>
                      </SidebarMenuButton>
                      {entry.path === "/notifications" && me.unread > 0 && <SidebarMenuBadge>{me.unread}</SidebarMenuBadge>}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="flex-row items-center justify-between px-3 pb-2 group-data-[collapsible=icon]:justify-center">
        {!isFolded && <span className="text-xs text-muted-foreground tabular-nums">{VERSION}</span>}
        <Button variant="ghost" size="icon-sm" aria-label={isFolded ? "사이드바 펼치기" : "사이드바 접기"} onClick={toggleSidebar}>
          {isFolded ? <ChevronsRightIcon /> : <ChevronsLeftIcon />}
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}

function MeAvatar() {
  return (
    <Avatar className="size-8 squircle rounded-[0.625rem] after:rounded-[0.625rem]">
      <AvatarFallback className="squircle rounded-[0.625rem] bg-secondary text-xs font-semibold">{me.initials}</AvatarFallback>
    </Avatar>
  )
}
