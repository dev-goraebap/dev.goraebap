import { Link } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { cn } from "cn"
import { ChevronDownIcon, ChevronUpIcon, FileTextIcon, SearchIcon, type Icon } from "@/shared/ui/kit/icon"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/kit/popover"
import { MeButton, type ShellMe } from "./MeMenu"
import { MoreRow } from "./MobileTabBar"
import { badgeText, contains, EXACT_LINK, phoneEntriesOf, type NavEntry, type NavSpace } from "./nav"

/**
 * 휴대폰 메뉴 시트가 머리에서 바꿔 보이는 공간 하나: 이름 · 아이콘과 그 공간의 메뉴. footer는 메뉴 아래 구분선 뒤에 서는 줄들이다
 * (그 공간의 관리처럼 데스크톱에서는 사이드바 바닥에 있는 것).
 */
export type PhoneSpace = { id: string; label: string; icon: Icon; space: NavSpace; footer?: NavEntry[] }

export type PhoneBarProps = {
  /** 늘 같은 앞 칸들(Linear의 Inbox · My issues · Pulse). 공간과 관계없이 그대로다. */
  tabs: NavEntry[]
  /** 메뉴 시트가 머리에서 바꿔 보이는 공간들. */
  spaces: PhoneSpace[]
  /** 지금 주소가 속한 공간(시트가 처음 보이는 것). 없으면 첫 공간. */
  currentSpaceId?: string
  /** 지금 주소의 메뉴 항목(지금 공간의 메뉴에서 찾은 것). 앞 칸이 아니면 끝 칸에 그 아이콘이 선다. */
  current: NavEntry | undefined
  pathname: string
  onSearch?: () => void
  /** 내 사진: 메뉴 시트 머리 오른쪽(Linear의 설정 자리)에서 내 메뉴를 연다. */
  me?: ShellMe
}

/** 유리 면: 반투명 바탕 위로 뒤를 흐린다. 흐림을 못 쓰는 브라우저는 같은 색의 불투명 면이다. */
const GLASS = "border bg-background shadow-md supports-backdrop-filter:bg-background/55 supports-backdrop-filter:backdrop-blur-xl"
/**
 * 펼친 메뉴 시트는 덮개 위에 뜬다: 막대처럼 55%로 비치면 어두운 덮개가 비쳐 라이트 모드에서 회색으로 탁해 보였다(2026-11-16).
 * 시트는 거의 불투명하게 둔다.
 */
const SHEET = "border bg-background shadow-lg supports-backdrop-filter:bg-background/92 supports-backdrop-filter:backdrop-blur-xl"

/** 위아래 꺾쇠 한 쌍(⇕): 끝 칸이 다른 곳으로 바꾸는 단추임을 보인다. */
function Selector({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("flex flex-col items-center text-icon-muted [&_svg]:size-2.5", className)}>
      <ChevronUpIcon className="-mb-0.5" />
      <ChevronDownIcon className="-mt-0.5" />
    </span>
  )
}

const slotClass = (isCurrent: boolean) => cn(
  "relative flex h-11 min-w-0 flex-1 items-center justify-center gap-0.5 rounded-full text-muted-foreground outline-none transition-colors",
  "focus-visible:ring-2 focus-visible:ring-ring",
  isCurrent && "bg-pressed text-foreground",
)

/**
 * 휴대폰 하단(Linear 모바일): 화면 아래에서 띄운 둥근 유리 막대와 그 옆 검색 원. 막대의 앞 칸은 늘 같고, 끝 칸은 메뉴 시트를
 * 연다. 시트 머리는 공간 이름 ⇕(누르면 다른 공간의 메뉴로 바뀐다), 그 아래는 그 공간의 메뉴(데스크톱 사이드바와 같은 것)다.
 * 시트에서 고른 곳이 앞 칸이 아니면 끝 칸에 그 아이콘이 남아, 지금 자리와 바꾸는 단추가 한 칸에 보인다.
 * 페이지는 막대 몫(--phone-bar-space)을 아래에 비워 마지막 줄이 막대에 가리지 않는다(AppShell이 정한다).
 */
export function PhoneBar({ tabs, spaces, currentSpaceId, current, pathname, onSearch, me }: PhoneBarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [shownId, setShownId] = useState(currentSpaceId ?? spaces[0]?.id)
  useEffect(() => setIsOpen(false), [pathname])
  useEffect(() => { if (isOpen) setShownId(currentSpaceId ?? spaces[0]?.id) }, [isOpen, currentSpaceId, spaces])
  const at = (path: string) => pathname === path || pathname.startsWith(`${path}/`)
  const onTab = tabs.some(tab => at(tab.path))
  const shown = spaces.find(each => each.id === shownId) ?? spaces[0]
  const next = spaces[(spaces.indexOf(shown!) + 1) % spaces.length]
  const Place = !onTab && current?.icon ? current.icon : undefined
  const close = () => setIsOpen(false)
  // 메뉴 시트는 앞 칸 묶음(막대) 자리에서 그 너비로 펼쳐져 막대를 덮는다(Linear 모바일처럼, 막대 위로 따로 뜨지 않는다).
  const bar = useRef<HTMLElement>(null)
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 px-4 pr-[max(1rem,env(safe-area-inset-right))] pb-[calc(0.75rem+env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))]">
      <nav ref={bar} aria-label="주 메뉴" className={cn("phone-bar pointer-events-auto flex h-14 min-w-0 flex-1 items-center gap-1 rounded-full p-1.5 transition-opacity", GLASS, isOpen && "opacity-0")}>
        {tabs.map(tab => {
          const isCurrent = at(tab.path)
          const TabIcon = tab.icon ?? FileTextIcon
          return (
            <Link key={tab.path} to={tab.path} search={tab.search as never} activeOptions={EXACT_LINK} aria-label={tab.label}
              aria-current={isCurrent ? "page" : undefined} className={slotClass(isCurrent)}>
              <TabIcon chosen={isCurrent} className="size-6" />
              {tab.badge ? <span className="absolute top-1 left-[calc(50%+0.375rem)] min-w-4 rounded-full bg-foreground px-1 text-[0.625rem] leading-4 text-background tabular-nums">{badgeText(tab.badge)}</span> : null}
            </Link>
          )
        })}
        {/* modal: 시트가 열린 동안 바깥은 눌리지 않고, 바깥(옅은 덮개)을 누르면 닫히기만 한다(바텀시트처럼). */}
        <Popover open={isOpen} onOpenChange={setIsOpen} modal>
          <PopoverTrigger render={
            <button type="button" aria-label={Place ? `${current?.label}, 메뉴 열기` : "메뉴 열기"} className={slotClass(!onTab || isOpen)}>
              {Place && <Place chosen className="size-6" />}
              <Selector className={Place ? undefined : "[&_svg]:size-3.5"} />
            </button>
          } />
          <PopoverContent hasBackdrop anchor={bar} side="top" align="start" sideOffset={-56} className={cn("w-(--anchor-width) gap-1 rounded-[1.75rem] p-2", SHEET)}>
            <div className="flex items-center gap-1">
              {shown && (
                <button type="button" onClick={() => next && setShownId(next.id)} aria-label={next ? `${shown.label} 메뉴, ${next.label}로 바꾸기` : `${shown.label} 메뉴`}
                  className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-xl px-3 text-base font-semibold outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
                  <shown.icon chosen className="size-5 shrink-0" />
                  <span className="min-w-0 truncate">{shown.label}</span>
                  <Selector />
                </button>
              )}
              {me && <MeButton me={me} align="end" className="ml-auto shrink-0" />}
            </div>
            <div aria-hidden className="mx-3 border-t" />
            <nav aria-label={shown ? `${shown.label} 메뉴` : "메뉴"} className="max-h-[60dvh] overflow-y-auto">
              <ul className="flex flex-col">
                {shown && phoneEntriesOf(shown.space).map(entry => (
                  <li key={`${entry.path}:${entry.label}`}><MoreRow entry={entry} current={current && contains(entry, current) ? current : undefined} depth={0} onPick={close} /></li>
                ))}
              </ul>
              {shown?.footer?.length ? <>
                <div aria-hidden className="mx-3 my-1 border-t" />
                <ul className="flex flex-col">
                  {shown.footer.map(entry => (
                    <li key={`${entry.path}:${entry.label}`}><MoreRow entry={entry} current={current && contains(entry, current) ? current : undefined} depth={0} onPick={close} /></li>
                  ))}
                </ul>
              </> : null}
            </nav>
          </PopoverContent>
        </Popover>
      </nav>
      {onSearch && (
        <button type="button" aria-label="검색" onClick={onSearch}
          className={cn("phone-bar-search pointer-events-auto grid size-14 shrink-0 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring", GLASS)}>
          <SearchIcon className="size-6" />
        </button>
      )}
    </div>
  )
}
