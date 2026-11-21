import { Collapsible } from "@base-ui/react/collapsible"
import { Link } from "@tanstack/react-router"
import { useEffect, useState, type ReactNode } from "react"
import { cn } from "cn"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/shared/ui/kit/dropdown-menu"
import { ArrowLeftIcon, ChevronDownIcon, MoreHorizontalIcon, SquareArrowOutUpRightIcon } from "@/shared/ui/kit/icon"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarHeader,
  SidebarMenu, SidebarMenuAction, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton,
  SidebarMenuSubItem, SidebarSeparator, useSidebar,
} from "@/shared/ui/kit/sidebar"
import { MeBox, MeButton, type ShellMe } from "./MeMenu"
import { badgeText, contains, entriesOf, EXACT_LINK, type NavEntry, type NavSpace } from "./nav"

export type ShellLayout = "inset" | "split"
/** 'all'은 아래 줄 묶음을 모두 펼친다(메뉴가 짧은 업무 앱). 'current'는 지금 자리의 묶음만(묶음이 많은 문서 사이트). */
export type OpenGroups = "all" | "current"
/** 접힌 사이드바에도 그리는 자리는 접힘 여부를 받는다. */
export type FoldSlot = ReactNode | ((isFolded: boolean) => ReactNode)

export const slot = (value: FoldSlot | undefined, isFolded: boolean) => (typeof value === "function" ? value(isFolded) : value)
const keyOf = (entry: NavEntry) => (entry.search ? `${entry.path}?${new URLSearchParams(entry.search)}` : entry.path)

/** 지금 자리까지 내려가는 묶음들(위에서부터). 모두 열어 지금 자리가 보이게 한다. */
function trailTo(list: readonly NavEntry[], current: NavEntry | undefined): string[] {
  for (const entry of list) {
    if (!entry.children?.length || !contains(entry, current)) continue
    return [keyOf(entry), ...trailTo(entry.children, current)]
  }
  return []
}

type Groups = { isOpen: (entry: NavEntry) => boolean | undefined; setOpen: (entry: NavEntry, isOpen: boolean) => void }

/**
 * 접고 펴는 칸의 움직임: Base UI가 재 둔 높이(--collapsible-panel-height)로 200ms 동안 줄고 는다. 움직임을 줄이는 설정이면 바로 바뀐다.
 */
const PANEL = "h-(--collapsible-panel-height) overflow-hidden [interpolate-size:allow-keywords] transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0 motion-reduce:transition-none"

const FOLDS_KEY = "app-shell:folds"

/**
 * 사용자가 접어 둔 것(묶음 머리 · 아래 줄 있는 항목)의 기록: 접은 것만 남기고, 새로고침해도 그대로다(Linear). 이 브라우저에 남는다.
 * 저장할 수 없으면(사생활 보호 창 등) 이번 화면에만 반영한다.
 */
function useFolds() {
  const [folded, setFolded] = useState<ReadonlySet<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(FOLDS_KEY) ?? "[]") as string[]) } catch { return new Set() }
  })
  const setOpen = (id: string, isOpen: boolean) => setFolded(current => {
    const next = new Set(current)
    if (isOpen) next.delete(id)
    else next.add(id)
    try { localStorage.setItem(FOLDS_KEY, JSON.stringify([...next])) } catch { /* 이번 화면에만 */ }
    return next
  })
  return { isOpen: (id: string) => !folded.has(id), setOpen }
}
type Folds = ReturnType<typeof useFolds>

/**
 * 'current'의 펼침 상태. 다른 묶음 안으로 옮겨 가면 그 묶음도 펼치고, 사용자가 연 묶음은 그대로 둔다.
 * 'all'은 처음에 모두 펼치고, 사용자가 접은 것을 기억한다(useFolds).
 */
function useGroups(mode: OpenGroups, entries: readonly NavEntry[], current: NavEntry | undefined, folds: Folds): Groups {
  const trail = trailTo(entries, current).join("\n")
  const [open, setOpenKeys] = useState(() => new Set(trail ? trail.split("\n") : []))
  useEffect(() => {
    if (!trail) return
    setOpenKeys(keys => (trail.split("\n").every(key => keys.has(key)) ? keys : new Set([...keys, ...trail.split("\n")])))
  }, [trail])
  if (mode === "all") return { isOpen: entry => folds.isOpen(`entry:${keyOf(entry)}`), setOpen: (entry, isOpen) => folds.setOpen(`entry:${keyOf(entry)}`, isOpen) }
  return {
    isOpen: entry => open.has(keyOf(entry)),
    setOpen: (entry, isOpen) => setOpenKeys(keys => {
      const next = new Set(keys)
      if (isOpen) next.add(keyOf(entry))
      else next.delete(keyOf(entry))
      return next
    }),
  }
}

export type ShellSidebarProps = {
  space: NavSpace
  /**
   * 메뉴 아래 "관리" 이름표 묶음(권한이 있을 때의 관리 화면, 2026-11-15). 관리는 다른 공간이라 줄 끝에 옮겨 가는 표시를 둔다.
   */
  adminEntries?: NavEntry[]
  current: NavEntry | undefined
  /** 머리의 로고 · 이름(홈 링크는 앱이 감싼다). 접힌 사이드바는 표시만 남긴다. 셸의 머리 줄이 있으면 그쪽에 두고 비운다. */
  brand?: FoldSlot
  /** 머리 줄 오른쪽 작은 도구(전역 검색). 접히면 로고 아래로 내려간다. */
  headerTools?: ReactNode
  me?: ShellMe
  /** 바닥 왼쪽(릴리스 · 환경). 접기 단추는 셸이 둔다. */
  footer?: FoldSlot
  layout: ShellLayout
  openGroups: OpenGroups
  /** 화면 아래에 줄(에이전트 줄)이 있다: 사이드바도 그만큼 짧아져, 바닥(접기 · 버전)이 본문 면 바닥과 같은 높이에 선다. */
  isAboveBar?: boolean
}

/**
 * 데스크톱 사이드바(cowork AppFrame). 머리: 로고 · 도구, 그 아래 내 박스. 몸: 공간의 메뉴(하위 공간이면 맨 위에 ← 공간 이름),
 * 아래 줄이 있는 항목은 오른쪽 끝 꺾쇠로 접고 편다. 바닥: 앱의 한 줄과 접기. 접으면 아이콘만 남고 묶음 사이를 가는 선으로 나눈다.
 */
export function ShellSidebar({ space, current, brand, headerTools, me, footer, adminEntries, layout, openGroups, isAboveBar }: ShellSidebarProps) {
  const { state } = useSidebar()
  const isFolded = state === "collapsed"
  const folds = useFolds()
  const groups = useGroups(openGroups, entriesOf(space), current, folds)
  return (
    <Sidebar collapsible="icon" variant={layout === "inset" ? "inset" : "sidebar"} aria-label="주 메뉴"
      className={isAboveBar ? "h-[calc(100svh-2.5rem)]" : undefined}>
      {/* 머리와 메뉴 본문의 좌우 패딩을 같은 선(호버 박스 12px · 아이콘 20px)에 맞춘다. */}
      {(brand || headerTools || me) && <SidebarHeader className="gap-3 overflow-y-hidden px-3 py-0 group-data-[collapsible=icon]:px-2">
        {/* inset·split 모두 머리 줄을 페이지 머리 줄(52px)과 같은 높이와 중심선에 둔다. */}
        <div className="flex h-13 items-center justify-between gap-2 group-data-[collapsible=icon]:h-auto group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:py-2.5">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:flex-col">{slot(brand, isFolded)}</div>
          {headerTools && <div className="flex shrink-0 items-center gap-1 pr-1.5 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:pr-0">{headerTools}</div>}
        </div>
        {me && (isFolded ? <MeButton me={me} className="mx-auto" /> : <MeBox me={me} />)}
      </SidebarHeader>}
      {/* 스크롤바 트랙을 숨겨 Windows에서도 좌우 여백이 대칭을 유지하고, 스크롤 유무에 따라 메뉴가 좌우로 흔들리지 않게 한다. */}
      <SidebarContent className="px-1 [scrollbar-width:none]">
        {space.back && (
          <SidebarGroup className="py-1">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={space.back.label} aria-label={`${space.back.label}: ${space.title}`}
                  render={<Link to={space.back.path} activeOptions={EXACT_LINK} />} className="font-semibold">
                  <ArrowLeftIcon />
                  <span>{space.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}
        {space.sections.map((section, index) => {
          const content = (
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {section.entries.map(entry => <TopItem key={keyOf(entry)} entry={entry} current={current} groups={groups} />)}
              </SidebarMenu>
            </SidebarGroupContent>
          )
          // 이름 있는 묶음의 머리(Linear의 Your teams ▾)는 누르면 그 묶음을 접고 펴기만 한다. 접은 사이드바는 머리 없이 늘 펼친다.
          if (section.isHeaderHidden || section.isLabel || isFolded) {
            return (
              <SidebarGroup key={section.title} className="group/section py-1">
                {isFolded && (index > 0 || space.back) && <SidebarSeparator className="mx-0 mb-1 data-horizontal:w-7" />}
                {/* 이름표: 접는 줄과 같은 자리 · 글자, 꺾쇠와 누름 없이. */}
                {section.isLabel && !section.isHeaderHidden && !isFolded && (
                  <div className={cn("flex h-8 items-center px-2 text-sm text-muted-foreground", section.action && "pr-8")}>{section.title}</div>
                )}
                {section.isLabel && section.action && !isFolded && (
                  <SidebarGroupAction aria-label={section.action.label} title={section.action.label} onClick={section.action.onClick}
                    className="top-2.5 right-2 opacity-0 group-hover/section:opacity-100 focus-visible:opacity-100">
                    <section.action.icon />
                  </SidebarGroupAction>
                )}
                {content}
              </SidebarGroup>
            )
          }
          return (
            <Collapsible.Root key={section.title} open={folds.isOpen(`section:${space.id}:${section.title}`)}
              onOpenChange={isOpen => folds.setOpen(`section:${space.id}:${section.title}`, isOpen)} render={<SidebarGroup className="group/section py-1" />}>
              <Collapsible.Trigger className={cn("group/head flex h-8 w-full items-center gap-1.5 rounded-[0.625rem] px-2 text-left text-sm text-muted-foreground outline-none",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring", section.action && "pr-8")}>
                <span className="truncate">{section.title}</span>
                <ChevronDownIcon className="size-3 shrink-0 text-icon-muted transition-transform group-not-data-panel-open/head:-rotate-90" />
              </Collapsible.Trigger>
              {section.action && (
                <SidebarGroupAction aria-label={section.action.label} title={section.action.label} onClick={section.action.onClick}
                  className="top-2.5 right-2 opacity-0 group-hover/section:opacity-100 focus-visible:opacity-100">
                  <section.action.icon />
                </SidebarGroupAction>
              )}
              <Collapsible.Panel className={PANEL}>{content}</Collapsible.Panel>
            </Collapsible.Root>
          )
        })}
        {adminEntries && adminEntries.length > 0 && (
          // 메뉴 묶음들 아래 "관리" 이름표(오피스 · 워크스페이스 이름표와 같은 모양). 항목은 다른 공간으로 옮겨 가므로 줄 끝에 ↗.
          <SidebarGroup className="py-1">
            {isFolded ? <SidebarSeparator className="mx-0 mb-1 data-horizontal:w-7" />
              : <div className="flex h-8 items-center px-2 text-sm text-muted-foreground">관리</div>}
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {adminEntries.map(entry => <TopItem key={keyOf(entry)} entry={entry} current={current} groups={groups}
                  trailing={<SquareArrowOutUpRightIcon aria-label="다른 공간으로 이동" className="ml-auto size-3.5 shrink-0 text-icon-muted" />} />)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      {footer ? <SidebarFooter className="flex-row items-center px-3 pb-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:justify-center">
        <div className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground group-data-[collapsible=icon]:flex-col">{slot(footer, isFolded)}</div>
      </SidebarFooter> : null}
    </Sidebar>
  )
}

/** 항목의 그림: media(프로젝트 표식)가 먼저, 없으면 아이콘(지금 자리면 Bold Duotone). */
function EntryMark({ entry, isCurrent }: { entry: NavEntry; isCurrent: boolean }) {
  if (entry.media) return <>{entry.media}</>
  return entry.icon ? <entry.icon chosen={isCurrent} /> : null
}

const linkOf = (entry: NavEntry) => (entry.isDisabled ? undefined : <Link to={entry.path} search={entry.search as never} activeOptions={EXACT_LINK} />)

/** 아래 줄을 접고 펴는 꺾쇠(오른쪽 끝). 접힌 동안 오른쪽을 가리킨다. */
function GroupTrigger({ entry }: { entry: NavEntry }) {
  return (
    <Collapsible.Trigger aria-label={`${entry.label} 아래 메뉴`} render={<SidebarMenuAction />}
      className="[&>svg]:transition-transform not-data-panel-open:[&>svg]:-rotate-90">
      <ChevronDownIcon />
    </Collapsible.Trigger>
  )
}

/**
 * 최상위 항목. 아래 줄이 지금 자리여도 함께 칠해 어느 묶음 안인지 보인다(cowork). 아래 줄이 있으면 처음에 펼친다
 * ('current'는 지금 자리의 묶음만).
 */
function TopItem({ entry, current, groups, trailing }: { entry: NavEntry; current: NavEntry | undefined; groups: Groups; trailing?: ReactNode }) {
  const isCurrent = contains(entry, current)
  const children = entry.children ?? []
  const { state } = useSidebar()
  if (entry.isGroup && children.length > 0 && state !== "collapsed") return <GroupItem entry={entry} current={current} groups={groups} />
  // 할 일 항목(탐색): 이동하지 않고 그 일을 한다.
  if (entry.onSelect) return <SidebarMenuItem>
    <SidebarMenuButton tooltip={entry.label} onClick={entry.onSelect}>
      <EntryMark entry={entry} isCurrent={false} />
      <span>{entry.label}</span>
      {trailing}
    </SidebarMenuButton>
  </SidebarMenuItem>
  const button = (
    <SidebarMenuButton isActive={isCurrent} tooltip={entry.label} disabled={entry.isDisabled}
      aria-current={entry === current ? "page" : undefined} render={linkOf(entry)}>
      <EntryMark entry={entry} isCurrent={isCurrent} />
      <span>{entry.label}</span>
      {trailing}
    </SidebarMenuButton>
  )
  const badge = entry.badge ? <SidebarMenuBadge className={cn(children.length > 0 && "right-7")}>{badgeText(entry.badge)}</SidebarMenuBadge> : null
  if (children.length === 0) return <SidebarMenuItem>{button}{badge}</SidebarMenuItem>
  return (
    <Collapsible.Root defaultOpen open={groups.isOpen(entry)} onOpenChange={isOpen => groups.setOpen(entry, isOpen)} render={<SidebarMenuItem />}>
      {button}
      {badge}
      <GroupTrigger entry={entry} />
      <Collapsible.Panel className={PANEL}>
        <SidebarMenuSub>
          {children.map(child => <SubItem key={keyOf(child)} entry={child} current={current} groups={groups} />)}
        </SidebarMenuSub>
      </Collapsible.Panel>
    </Collapsible.Root>
  )
}

/**
 * 묶음 머리(Linear의 팀 줄): 누르면 아래 줄을 접고 펴기만 한다. 이름 뒤 작은 꺾쇠가 접힘을 보인다. 지금 자리가 그 안이어도
 * 머리는 칠하지 않는다(아래 줄이 칠해진다).
 */
function GroupItem({ entry, current, groups }: { entry: NavEntry; current: NavEntry | undefined; groups: Groups }) {
  return (
    <Collapsible.Root defaultOpen open={groups.isOpen(entry)} onOpenChange={isOpen => groups.setOpen(entry, isOpen)} render={<SidebarMenuItem />}>
      <Collapsible.Trigger render={<SidebarMenuButton tooltip={entry.label} />} className={cn("group/group", entry.menu && "pr-8")}>
        <EntryMark entry={entry} isCurrent={false} />
        <span>{entry.label}</span>
        <ChevronDownIcon className="size-3! text-icon-muted transition-transform group-not-data-panel-open/group:-rotate-90" />
      </Collapsible.Trigger>
      {entry.menu && (
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuAction showOnHover aria-label={`${entry.label} 메뉴`} />}><MoreHorizontalIcon /></DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="min-w-52">{entry.menu}</DropdownMenuContent>
        </DropdownMenu>
      )}
      <Collapsible.Panel className={PANEL}>
        <SidebarMenuSub>
          {(entry.children ?? []).map(child => <SubItem key={keyOf(child)} entry={child} current={current} groups={groups} />)}
        </SidebarMenuSub>
      </Collapsible.Panel>
    </Collapsible.Root>
  )
}

/** 아래 줄. 다시 아래 줄이 있으면 같은 꺾쇠로 접고, 그 안의 줄은 한 단계 더 들인다. */
function SubItem({ entry, current, groups }: { entry: NavEntry; current: NavEntry | undefined; groups: Groups }) {
  const isCurrent = entry === current
  const children = entry.children ?? []
  const button = (
    <SidebarMenuSubButton isActive={isCurrent} aria-current={isCurrent ? "page" : undefined} aria-disabled={entry.isDisabled || undefined}
      render={linkOf(entry) ?? <span />} className={cn(children.length > 0 && "pr-8", entry.badge && "pr-8")}>
      <EntryMark entry={entry} isCurrent={isCurrent} />
      <span>{entry.label}</span>
    </SidebarMenuSubButton>
  )
  const badge = entry.badge ? <SidebarMenuBadge className={cn("top-1", children.length > 0 && "right-7")}>{badgeText(entry.badge)}</SidebarMenuBadge> : null
  if (children.length === 0) return <SidebarMenuSubItem>{button}{badge}</SidebarMenuSubItem>
  return (
    <Collapsible.Root defaultOpen open={groups.isOpen(entry)} onOpenChange={isOpen => groups.setOpen(entry, isOpen)} render={<SidebarMenuSubItem />}>
      {button}
      {badge}
      <GroupTrigger entry={entry} />
      <Collapsible.Panel className={PANEL}>
        <SidebarMenuSub className="mr-0 pr-0">
          {children.map(child => <SubItem key={keyOf(child)} entry={child} current={current} groups={groups} />)}
        </SidebarMenuSub>
      </Collapsible.Panel>
    </Collapsible.Root>
  )
}
