import { Collapsible } from "@base-ui/react/collapsible"
import { Link, useRouterState } from "@tanstack/react-router"
import { ProjectMark, useProjects } from "@/entities/project"
import { paths } from "@/shared/config"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar"
import { Button } from "@/shared/ui/button"
import { ArrowLeftIcon, ChevronDownIcon, ChevronsLeftIcon, ChevronsRightIcon, MoreVerticalIcon, SearchIcon } from "@/shared/ui/icon"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuAction, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton,
  SidebarMenuSubItem, SidebarSeparator, useSidebar,
} from "@/shared/ui/sidebar"
import { Skeleton } from "@/shared/ui/skeleton"
import { useMe, useUnreadCount } from "../model/me"
import { currentEntry, spaceOf, type NavEntry } from "../model/nav"
import { Brand } from "./Brand"
import { MeMenu } from "./MeMenu"

const VERSION = "v0.1.0"

/**
 * 데스크톱 사이드바(호호코워크 AppFrame). 머리: 로고 · 검색, 그 아래 내 박스. 몸: 주소가 속한 메뉴 구역(프로젝트 아래에 별표한 프로젝트).
 * 바닥: 릴리스와 접기. 접으면 아이콘만 남고 구역 사이를 가는 선으로 나눈다.
 */
export function AppSidebar({ onSearch }: { onSearch: () => void }) {
  const pathname = useRouterState({ select: state => state.location.pathname })
  const { state, toggleSidebar } = useSidebar()
  const isFolded = state === "collapsed"
  const space = spaceOf(pathname)
  const current = currentEntry(space, pathname)
  const unread = useUnreadCount()
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="gap-3 px-3 pt-3 group-data-[collapsible=icon]:px-2">
        <div className="flex h-8 items-center justify-between group-data-[collapsible=icon]:h-auto group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2">
          <Link to={space.sections[0].entries[0].path} aria-label="처음으로"><Brand isFolded={isFolded} /></Link>
          <Button variant="ghost" size="icon-sm" aria-label="검색" title="검색 (Ctrl+K)" onClick={onSearch}><SearchIcon /></Button>
        </div>
        {isFolded ? <MeMenu trigger={<button type="button" aria-label="내 메뉴" className="mx-auto"><MeAvatar /></button>} /> : <MeBox />}
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
                {section.entries.map(entry => entry.path === paths.projects
                  ? <ProjectsMenuItem key={entry.path} entry={entry} isCurrent={entry === current} />
                  : <NavMenuItem key={entry.path} entry={entry} isCurrent={entry === current}
                    badge={entry.path === paths.notifications && unread > 0 ? unread : undefined} />)}
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

function NavButton({ entry, isCurrent }: { entry: NavEntry; isCurrent: boolean }) {
  return (
    <SidebarMenuButton isActive={isCurrent} tooltip={entry.label} render={<Link to={entry.path} />}>
      <entry.icon chosen={isCurrent} />
      <span>{entry.label}</span>
    </SidebarMenuButton>
  )
}

function NavMenuItem({ entry, isCurrent, badge }: { entry: NavEntry; isCurrent: boolean; badge?: number }) {
  return (
    <SidebarMenuItem>
      <NavButton entry={entry} isCurrent={isCurrent} />
      {badge !== undefined && <SidebarMenuBadge>{badge}</SidebarMenuBadge>}
    </SidebarMenuItem>
  )
}

/** 프로젝트와 그 아래 별표한 활성 프로젝트. 하위 메뉴는 처음에 펼치고 오른쪽 끝 화살표로 접는다. 프로젝트 화면이 생기기 전까지 각 줄은 업무로 간다. */
function ProjectsMenuItem({ entry, isCurrent }: { entry: NavEntry; isCurrent: boolean }) {
  const starred = useProjects().data?.filter(project => project.starred && project.status === "active") ?? []
  if (starred.length === 0) return <NavMenuItem entry={entry} isCurrent={isCurrent} />
  return (
    <Collapsible.Root defaultOpen render={<SidebarMenuItem />}>
      <NavButton entry={entry} isCurrent={isCurrent} />
      <Collapsible.Trigger aria-label="별표한 프로젝트" render={<SidebarMenuAction />}
        className="[&>svg]:transition-transform not-data-panel-open:[&>svg]:-rotate-90">
        <ChevronDownIcon />
      </Collapsible.Trigger>
      <Collapsible.Panel>
        <SidebarMenuSub className="mt-0.5">
          {starred.map(project => (
            <SidebarMenuSubItem key={project.key}>
              <SidebarMenuSubButton render={<Link to={paths.workItems} />}>
                <ProjectMark icon={project.icon} color={project.color} size="sm" />
                <span>{project.name}</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </Collapsible.Panel>
    </Collapsible.Root>
  )
}

/** 펼친 사이드바의 내 박스: 아바타 · 이름 · 소속 · 세로 …, 누르면 내 메뉴. 내 정보에서 바꾼 그림을 따른다. */
function MeBox() {
  const me = useMe()
  return (
    <MeMenu trigger={
      <button type="button" className="flex w-full items-center gap-2.5 squircle rounded-xl bg-pressed px-2.5 py-2 text-left hover:bg-[color-mix(in_srgb,var(--foreground)_10%,transparent)]">
        <MeAvatar />
        <span className="flex min-w-0 flex-1 flex-col">
          {me ? (
            <>
              <span className="truncate text-sm font-semibold">{me.name}</span>
              <span className="truncate text-xs text-muted-foreground">{me.team}</span>
            </>
          ) : (
            <>
              <Skeleton className="my-0.5 h-4 w-16" />
              <Skeleton className="my-0.5 h-3 w-12" />
            </>
          )}
        </span>
        <MoreVerticalIcon className="rotate-90 text-icon-muted" />
      </button>
    } />
  )
}

function MeAvatar() {
  const me = useMe()
  return (
    <Avatar className="size-8 squircle rounded-[0.625rem] after:rounded-[0.625rem]">
      {me && <AvatarImage src={me.picture} alt="" className="squircle rounded-[0.625rem]" />}
      <AvatarFallback className="squircle rounded-[0.625rem] bg-secondary text-xs font-semibold">{me?.initials}</AvatarFallback>
    </Avatar>
  )
}
