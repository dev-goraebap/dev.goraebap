import { Link } from "@tanstack/react-router"
import { useState } from "react"
import { paths } from "@/shared/config"
import { cn } from "cn"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/shared/ui/drawer"
import { ArrowLeftIcon, MoreHorizontalIcon } from "@/shared/ui/icon"
import { entriesOf, type NavChild, type NavEntry } from "../model/nav"
import { useNavChildren } from "../model/use-nav-children"
import { useNavSpace } from "../model/use-nav-space"

/**
 * 휴대폰 하단 탭(64rem 미만). 지금 구역 메뉴의 앞 4개와 더보기. 알림함은 앱 바에 있으므로 탭에 넣지 않는다. 더보기는 나머지 메뉴를 바텀시트 한 목록으로 보이고,
 * 메인이 아닌 구역(프로젝트 · 내 계정)이면 맨 위에 돌아가기를 둔다. 항목 아래 줄(별표한 프로젝트 · 업무 뷰 · 저장한 뷰)은 탭에 두지 않고
 * 더보기 목록에 그 항목 자리 다음으로 넣는다(호호코워크 MobileMenuSheet).
 * 고른 탭은 같은 아이콘의 Bold Duotone.
 */
export function MobileTabBar() {
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const { space, current } = useNavSpace()
  const childrenOf = useNavChildren()
  const entries = entriesOf(space).filter(entry => entry.path !== paths.notifications)
  const tabs = entries.slice(0, 4)
  // 더보기의 줄: 탭에 없는 항목과, 모든 항목의 아래 줄(탭 항목의 것도).
  const more: Row[] = entries.flatMap(entry => [
    ...(tabs.includes(entry) ? [] : [{ key: entry.path, path: entry.path, label: entry.label, icon: entry.icon, isCurrent: entry === current }]),
    ...childrenOf(entry).map(child => ({ ...child, key: `${entry.path}:${child.key}` })),
  ])
  const isMoreChosen = isMoreOpen || Boolean(current && !tabs.includes(current))
  return (
    <>
      <nav aria-label="주 메뉴" className="flex shrink-0 border-t bg-background pb-[env(safe-area-inset-bottom)]">
        {tabs.map(entry => <Tab key={entry.path} entry={entry} isCurrent={entry === current} />)}
        {(more.length > 0 || space.back) && (
          <button type="button" aria-haspopup="dialog" aria-expanded={isMoreOpen} onClick={() => setIsMoreOpen(true)}
            className={tabClass(isMoreChosen)}>
            <MoreHorizontalIcon chosen={isMoreChosen} className="size-6" />
            <span>더보기</span>
          </button>
        )}
      </nav>
      <Drawer open={isMoreOpen} onOpenChange={setIsMoreOpen}>
        <DrawerContent>
          <DrawerHeader><DrawerTitle>더보기</DrawerTitle></DrawerHeader>
          <ul className="flex flex-col px-3 pb-5">
            {space.back && (
              <li>
                <Link to={space.back.path} onClick={() => setIsMoreOpen(false)}
                  className="flex h-12 items-center gap-3 squircle rounded-xl px-3 text-base">
                  <ArrowLeftIcon className="size-5" />
                  {space.back.label}
                </Link>
              </li>
            )}
            {more.map(row => (
              <li key={row.key}>
                <Link to={row.path} search={row.search as never} onClick={() => setIsMoreOpen(false)} aria-current={row.isCurrent ? "page" : undefined}
                  className="flex h-12 items-center gap-3 squircle rounded-xl px-3 text-base aria-[current=page]:bg-pressed aria-[current=page]:font-medium">
                  {row.media ?? <row.icon chosen={row.isCurrent} className="size-5" />}
                  <span className="truncate">{row.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </DrawerContent>
      </Drawer>
    </>
  )
}

/** 더보기 목록의 줄: 탭에 없는 항목, 또는 항목 아래 줄. */
type Row = Pick<NavChild, "key" | "path" | "search" | "label" | "icon" | "media" | "isCurrent">

const tabClass = (isCurrent: boolean) =>
  cn("flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[0.6875rem] text-muted-foreground", isCurrent && "text-foreground")

function Tab({ entry, isCurrent }: { entry: NavEntry; isCurrent: boolean }) {
  return (
    <Link to={entry.path} aria-current={isCurrent ? "page" : undefined} className={tabClass(isCurrent)}>
      <entry.icon chosen={isCurrent} className="size-6" />
      <span>{entry.label}</span>
    </Link>
  )
}
