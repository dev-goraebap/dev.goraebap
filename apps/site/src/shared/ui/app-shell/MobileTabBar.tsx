import { Link } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { cn } from "cn"
import { Button } from "@/shared/ui/button"
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from "@/shared/ui/drawer"
import { ArrowLeftIcon, FileTextIcon, MoreHorizontalIcon, XIcon } from "@/shared/ui/icon"
import { badgeText, contains, EXACT_LINK, phoneEntriesOf, type NavEntry, type NavSpace } from "./nav"

const tabClass = (isCurrent: boolean) => cn(
  "relative flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-medium text-muted-foreground outline-none",
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset aria-disabled:text-muted-foreground/50",
  isCurrent && "text-foreground",
)

/**
 * 휴대폰 하단 탭(64rem 미만): 공간 메뉴의 앞 네 곳(tabs로 바꿀 수 있다)과 더보기. 엄지가 닿는 아래에 두고 홈 표시줄을 피한다.
 * 고른 탭과 열린 더보기는 진한 글자와 Bold Duotone이다. 더보기는 나머지 목적지를 바텀시트 한 목록으로 보이고, 하위 공간이면
 * 공간 이름을 제목으로, 맨 위에 돌아가기를 둔다. 아래 줄은 위 항목 아래 들여 쓴 묶음으로 남긴다(위 항목이 탭에 있어도 묶음 머리로 다시 보인다).
 */
export function MobileTabBar({ space, current, tabs: chosenTabs, pathname }: {
  space: NavSpace; current: NavEntry | undefined; tabs?: NavEntry[]
  /** 주소가 바뀌면 더보기를 닫는다. */
  pathname: string
}) {
  const [isMoreOpen, setMoreOpen] = useState(false)
  useEffect(() => setMoreOpen(false), [pathname])
  const entries = phoneEntriesOf(space)
  const tabs = chosenTabs ?? entries.slice(0, 4)
  const more = entries.flatMap(entry => {
    const isTab = tabs.includes(entry)
    const children = entry.children ?? []
    return isTab && children.length === 0 ? [] : [{ entry, isTab }]
  })
  const hasMore = more.length > 0 || Boolean(space.back)
  const isMoreChosen = isMoreOpen || Boolean(current && !tabs.some(tab => contains(tab, current)))
  const title = space.back ? space.title : "더보기"
  const close = () => setMoreOpen(false)
  return (
    <>
      <nav aria-label="주 메뉴" className="flex shrink-0 border-t bg-background pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]">
        {tabs.map(entry => <Tab key={`${entry.path}:${entry.label}`} entry={entry} isCurrent={contains(entry, current)} />)}
        {hasMore && (
          <button type="button" aria-haspopup="dialog" aria-expanded={isMoreOpen} onClick={() => setMoreOpen(true)} className={tabClass(isMoreChosen)}>
            <MoreHorizontalIcon chosen={isMoreChosen} className="size-6" />
            <span>더보기</span>
          </button>
        )}
      </nav>
      <Drawer open={isMoreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent>
          <DrawerHeader className="flex-row items-center gap-2 px-3 pt-3 pb-1 text-left">
            <DrawerTitle className="min-w-0 flex-1 truncate px-2 text-left text-base font-semibold">{title}</DrawerTitle>
            <DrawerClose render={<Button variant="ghost" size="icon" aria-label="메뉴 닫기" className="size-11" />}><XIcon className="size-5" /></DrawerClose>
          </DrawerHeader>
          <nav aria-label={title} className="min-h-0 overflow-y-auto px-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <ul className="flex flex-col">
              {space.back && (
                <li>
                  <Link to={space.back.path} activeOptions={EXACT_LINK} onClick={close} className={rowClass}>
                    <ArrowLeftIcon className="size-5 shrink-0" />
                    <span className="truncate">{space.back.label}</span>
                  </Link>
                </li>
              )}
              {more.map(({ entry }, index) => {
                const hasChildren = (entry.children?.length ?? 0) > 0
                const previousHasChildren = index > 0 && (more[index - 1].entry.children?.length ?? 0) > 0
                return (
                  // 아래 줄이 있는 묶음은 앞뒤를 가는 선으로 나눈다(접힌 사이드바가 묶음을 선으로 나누는 것과 같다).
                  <li key={`${entry.path}:${entry.label}`} className={cn((hasChildren || previousHasChildren) && (index > 0 || space.back) && "mt-2 border-t pt-2")}>
                    <MoreRow entry={entry} current={current} depth={0} onPick={close} />
                  </li>
                )
              })}
            </ul>
          </nav>
        </DrawerContent>
      </Drawer>
    </>
  )
}

function Tab({ entry, isCurrent }: { entry: NavEntry; isCurrent: boolean }) {
  const Icon = entry.icon ?? FileTextIcon
  const body = (
    <>
      <Icon chosen={isCurrent} className="size-6" />
      <span className="max-w-full truncate px-1">{entry.label}</span>
      {entry.badge ? <span className="absolute top-1.5 left-[calc(50%+0.5rem)] min-w-4 rounded-full bg-foreground px-1 text-[0.625rem] leading-4 text-background tabular-nums">{badgeText(entry.badge)}</span> : null}
    </>
  )
  if (entry.isDisabled) return <span aria-disabled className={tabClass(false)}>{body}</span>
  return <Link to={entry.path} search={entry.search as never} activeOptions={EXACT_LINK} aria-current={isCurrent ? "page" : undefined} className={tabClass(isCurrent)}>{body}</Link>
}

const rowClass = cn(
  "flex h-12 min-w-0 items-center gap-3 squircle rounded-xl px-3 text-base text-muted-foreground outline-none",
  "hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:bg-pressed aria-[current=page]:font-medium aria-[current=page]:text-foreground",
  "aria-disabled:text-muted-foreground/50 aria-disabled:hover:bg-transparent",
)

const INDENT = ["", "pl-11", "pl-19", "pl-27"]

/** 더보기의 줄 하나와 그 아래 줄. 아래 줄은 위 항목의 글자 시작선에 맞춰 들인다(사이드바와 같은 위계). */
function MoreRow({ entry, current, depth, onPick }: { entry: NavEntry; current: NavEntry | undefined; depth: number; onPick: () => void }) {
  const isCurrent = entry === current
  const children = entry.children ?? []
  const mark = entry.media ?? (entry.icon ? <entry.icon chosen={isCurrent} className="size-5 shrink-0" /> : null)
  // 들여쓰기는 단계마다 아이콘(20px) + 간격(12px)이라 위 항목의 글자 시작선에 선다.
  const indent = INDENT[Math.min(depth, INDENT.length - 1)]
  const body = (
    <>
      {mark}
      <span className="min-w-0 flex-1 truncate">{entry.label}</span>
      {entry.badge ? <span className="text-sm text-muted-foreground tabular-nums">{badgeText(entry.badge)}</span> : null}
    </>
  )
  return (
    <>
      {entry.isDisabled
        ? <span aria-disabled className={cn(rowClass, indent)}>{body}</span>
        : (
          <Link to={entry.path} search={entry.search as never} activeOptions={EXACT_LINK} onClick={onPick} aria-current={isCurrent ? "page" : undefined} className={cn(rowClass, indent)}>
            {body}
          </Link>
        )}
      {children.length > 0 && (
        <ul className="flex flex-col">
          {children.map(child => <li key={`${child.path}:${child.label}`}><MoreRow entry={child} current={current} depth={depth + 1} onPick={onPick} /></li>)}
        </ul>
      )}
    </>
  )
}
