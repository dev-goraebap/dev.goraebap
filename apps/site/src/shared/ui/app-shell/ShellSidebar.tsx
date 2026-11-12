import { Collapsible } from "@base-ui/react/collapsible"
import { Link } from "@tanstack/react-router"
import { useEffect, useState, type ReactNode } from "react"
import { cn } from "cn"
import { Button } from "@/shared/ui/button"
import { ArrowLeftIcon, ChevronDownIcon, ChevronsLeftIcon, ChevronsRightIcon } from "@/shared/ui/icon"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuAction, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton,
  SidebarMenuSubItem, SidebarSeparator, useSidebar,
} from "@/shared/ui/sidebar"
import { MeBox, MeButton, type ShellMe } from "./MeMenu"
import { badgeText, contains, entriesOf, EXACT_LINK, type NavEntry, type NavSpace } from "./nav"

export type ShellLayout = "inset" | "split"
/** 'all'은 아래 줄 묶음을 모두 펼친다(메뉴가 짧은 업무 앱). 'current'는 지금 자리의 묶음만(묶음이 많은 문서 사이트). */
export type OpenGroups = "all" | "current"
/** 접힌 사이드바에도 그리는 자리는 접힘 여부를 받는다. */
export type FoldSlot = ReactNode | ((isFolded: boolean) => ReactNode)

const slot = (value: FoldSlot | undefined, isFolded: boolean) => (typeof value === "function" ? value(isFolded) : value)
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
 * 'current'의 펼침 상태. 다른 묶음 안으로 옮겨 가면 그 묶음도 펼치고, 사용자가 연 묶음은 그대로 둔다.
 * 'all'은 펼침을 부품에 맡긴다(처음에 모두 펼침).
 */
function useGroups(mode: OpenGroups, entries: readonly NavEntry[], current: NavEntry | undefined): Groups {
  const trail = trailTo(entries, current).join("\n")
  const [open, setOpenKeys] = useState(() => new Set(trail ? trail.split("\n") : []))
  useEffect(() => {
    if (!trail) return
    setOpenKeys(keys => (trail.split("\n").every(key => keys.has(key)) ? keys : new Set([...keys, ...trail.split("\n")])))
  }, [trail])
  if (mode === "all") return { isOpen: () => undefined, setOpen: () => {} }
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
  current: NavEntry | undefined
  /** 머리의 로고 · 이름(홈 링크는 앱이 감싼다). 접힌 사이드바는 표시만 남긴다. */
  brand: FoldSlot
  /** 머리 줄 오른쪽 작은 도구(전역 검색). 접히면 로고 아래로 내려간다. */
  headerTools?: ReactNode
  me?: ShellMe
  /** 바닥 왼쪽(릴리스 · 환경). 접기 단추는 셸이 둔다. */
  footer?: FoldSlot
  layout: ShellLayout
  openGroups: OpenGroups
}

/**
 * 데스크톱 사이드바(호호코워크 AppFrame). 머리: 로고 · 도구, 그 아래 내 박스. 몸: 공간의 메뉴(하위 공간이면 맨 위에 ← 공간 이름),
 * 아래 줄이 있는 항목은 오른쪽 끝 꺾쇠로 접고 편다. 바닥: 앱의 한 줄과 접기. 접으면 아이콘만 남고 묶음 사이를 가는 선으로 나눈다.
 */
export function ShellSidebar({ space, current, brand, headerTools, me, footer, layout, openGroups }: ShellSidebarProps) {
  const { state, toggleSidebar } = useSidebar()
  const isFolded = state === "collapsed"
  const groups = useGroups(openGroups, entriesOf(space), current)
  const foldLabel = isFolded ? "사이드바 펼치기" : "사이드바 접기"
  return (
    <Sidebar collapsible="icon" variant={layout === "inset" ? "inset" : "sidebar"} aria-label="주 메뉴">
      <SidebarHeader className={cn("gap-3 px-3 group-data-[collapsible=icon]:px-2", layout === "inset" ? "pt-3" : "pt-0")}>
        {/* split은 머리 줄을 페이지 머리 줄(52px)과 같은 선에 둔다. */}
        <div className={cn("flex items-center justify-between gap-2 group-data-[collapsible=icon]:h-auto group-data-[collapsible=icon]:flex-col",
          layout === "inset" ? "h-8" : "h-13 group-data-[collapsible=icon]:pt-3")}>
          <div className="flex min-w-0 items-center">{slot(brand, isFolded)}</div>
          {headerTools && <div className="flex shrink-0 items-center gap-1 group-data-[collapsible=icon]:flex-col">{headerTools}</div>}
        </div>
        {me && (isFolded ? <MeButton me={me} className="mx-auto" /> : <MeBox me={me} />)}
      </SidebarHeader>
      <SidebarContent className="px-1">
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
        {space.sections.map((section, index) => (
          <SidebarGroup key={section.title} className="py-1">
            {isFolded && (index > 0 || space.back) && <SidebarSeparator className="mx-2 mb-1" />}
            {!section.isHeaderHidden && <SidebarGroupLabel>{section.title}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {section.entries.map(entry => <TopItem key={keyOf(entry)} entry={entry} current={current} groups={groups} />)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="flex-row items-center justify-between px-3 pb-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:justify-center">
        <div className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground group-data-[collapsible=icon]:flex-col">{slot(footer, isFolded)}</div>
        <Button variant="ghost" size="icon-sm" aria-label={foldLabel} title={`${foldLabel} (Ctrl+B)`} onClick={toggleSidebar}>
          {isFolded ? <ChevronsRightIcon /> : <ChevronsLeftIcon />}
        </Button>
      </SidebarFooter>
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
 * 최상위 항목. 아래 줄이 지금 자리여도 함께 칠해 어느 묶음 안인지 보인다(호호코워크). 아래 줄이 있으면 처음에 펼친다
 * ('current'는 지금 자리의 묶음만).
 */
function TopItem({ entry, current, groups }: { entry: NavEntry; current: NavEntry | undefined; groups: Groups }) {
  const isCurrent = contains(entry, current)
  const children = entry.children ?? []
  const button = (
    <SidebarMenuButton isActive={isCurrent} tooltip={entry.label} disabled={entry.isDisabled}
      aria-current={entry === current ? "page" : undefined} render={linkOf(entry)}>
      <EntryMark entry={entry} isCurrent={isCurrent} />
      <span>{entry.label}</span>
    </SidebarMenuButton>
  )
  const badge = entry.badge ? <SidebarMenuBadge className={cn(children.length > 0 && "right-7")}>{badgeText(entry.badge)}</SidebarMenuBadge> : null
  if (children.length === 0) return <SidebarMenuItem>{button}{badge}</SidebarMenuItem>
  return (
    <Collapsible.Root defaultOpen open={groups.isOpen(entry)} onOpenChange={isOpen => groups.setOpen(entry, isOpen)} render={<SidebarMenuItem />}>
      {button}
      {badge}
      <GroupTrigger entry={entry} />
      <Collapsible.Panel>
        <SidebarMenuSub>
          {children.map(child => <SubItem key={keyOf(child)} entry={child} current={current} groups={groups} />)}
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
      <Collapsible.Panel>
        <SidebarMenuSub className="mr-0 pr-0">
          {children.map(child => <SubItem key={keyOf(child)} entry={child} current={current} groups={groups} />)}
        </SidebarMenuSub>
      </Collapsible.Panel>
    </Collapsible.Root>
  )
}
