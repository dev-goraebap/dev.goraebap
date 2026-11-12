import { Command as CommandPrimitive } from "cmdk"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { Button } from "@/shared/ui/button"
import { Command, CommandDialog, CommandGroup, CommandItem, CommandList, CommandShortcut } from "@/shared/ui/command"
import { ArrowLeftIcon, ClockIcon, MaximizeIcon, SearchIcon, Trash2Icon, XIcon, type Icon } from "@/shared/ui/icon"
import { Page, useFullScreen } from "@/shared/ui/page"
import { PageState } from "@/shared/ui/page-state"
import { Spinner } from "@/shared/ui/spinner"
import { findIn, useRecentSearches, useSettled, type SearchHit, type SearchSource } from "../model/search"

/** 목록의 줄 하나: 갈 곳, 또는 다시 찾을 최근 검색어. */
type Row = { key: string; label: string; where?: string; icon: Icon; media?: ReactNode; end?: ReactNode; onPick: () => void }
type Group = { title: string; rows: Row[]; action?: ReactNode }

/**
 * 전역 검색(호호코워크 GlobalSearch, Linear의 명령 메뉴처럼): 맨 위 검색어, 그 아래 출처별 결과. 검색어는 200ms 멈춘 뒤 찾고,
 * 찾는 동안 이전 결과를 두며 칸 끝에 작은 스피너. 비었을 때는 최근 검색과 바로 가기. ↑ ↓ 고르기, Enter 열기, Esc 닫기.
 * surface가 dialog면 데스크톱 대화상자(화면 위 12%, 머리에 크게 보기), page면 /search 페이지(휴대폰은 ← 옆 검색칸의 전체 화면).
 */
export function GlobalSearch({ surface, sources, shortcuts, initialWords = "", onGo, onClose, onExpand, onWordsChange }: {
  surface: "dialog" | "page"
  sources: readonly SearchSource[]
  /** 아무것도 적기 전의 바로 가기. */
  shortcuts: readonly SearchHit[]
  /** 처음 검색어(페이지는 주소의 ?q, 크게 보기로 대화상자의 검색어를 이어받는다). */
  initialWords?: string
  onGo: (href: string) => void
  onClose: () => void
  /** 크게 보기: 같은 검색을 /search 페이지로. 지금 검색어를 넘긴다. 대화상자에만 있다. */
  onExpand?: (words: string) => void
  /** 멈춘(200ms) 검색어가 바뀔 때. 페이지가 주소의 ?q에 남겨 새로고침 · 링크가 같은 검색을 연다. */
  onWordsChange?: (words: string) => void
}) {
  const isMobile = useIsMobile()
  // 휴대폰의 검색 페이지는 상세처럼 전체 화면이다(하단 탭 없음).
  useFullScreen(surface === "page" && isMobile)
  const [words, setWords] = useState(initialWords)
  const settled = useSettled(words)
  // 알린 값과 같으면 다시 알리지 않는다(부르는 쪽이 주소를 바꿔 다시 그려도 되풀이되지 않도록).
  const reported = useRef(initialWords.trim())
  const onWordsChangeRef = useRef(onWordsChange)
  useEffect(() => { onWordsChangeRef.current = onWordsChange })
  useEffect(() => {
    const next = settled.trim()
    if (next === reported.current) return
    reported.current = next
    onWordsChangeRef.current?.(next)
  }, [settled])
  const recent = useRecentSearches()
  const input = useRef<HTMLInputElement>(null)
  const isAsking = words.trim() !== ""
  const found = findIn(sources, settled)
  const isPending = isAsking && (settled !== words || sources.some(source => source.isLoading))
  const isEmpty = isAsking && !isPending && found.length === 0

  const go = (hit: SearchHit) => {
    if (isAsking) recent.add(words)
    onGo(hit.href)
  }
  const ask = (each: string) => {
    setWords(each)
    input.current?.focus()
  }
  const hitRow = (hit: SearchHit): Row => ({ key: hit.id, label: hit.label, where: hit.where, icon: hit.icon, media: hit.media, onPick: () => go(hit) })
  const groups: Group[] = isAsking
    ? found.map(group => ({ title: group.source.title, rows: group.hits.map(hitRow) }))
    : [
      ...(recent.recent.length > 0 ? [{
        title: "최근 검색",
        action: <Button variant="ghost" size="icon-xs" aria-label="최근 검색 모두 지우기" title="모두 지우기" onClick={recent.clear}><Trash2Icon /></Button>,
        rows: recent.recent.map(each => ({
          key: `recent:${each}`, label: each, icon: ClockIcon, onPick: () => ask(each),
          end: (
            <Button variant="ghost" size="icon-xs" aria-label={`${each} 지우기`} title="지우기"
              onClick={event => { event.stopPropagation(); recent.remove(each) }}>
              <XIcon />
            </Button>
          ),
        })),
      }] : []),
      { title: "바로 가기", rows: shortcuts.map(hitRow) },
    ]

  // 결과가 바뀌면 첫 줄을 고른다(cmdk는 값으로 고른 줄을 기억한다).
  const first = groups[0]?.rows[0]?.key ?? ""
  const [active, setActive] = useState(first)
  useEffect(() => setActive(first), [first])

  const field = (
    <div className="flex min-w-0 flex-1 items-center gap-2 text-muted-foreground">
      <SearchIcon className="shrink-0" />
      <CommandPrimitive.Input ref={input} value={words} onValueChange={setWords} autoFocus aria-label="검색어" placeholder="페이지 · 업무 · 공지 · 사람 찾기"
        className="h-full min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground" />
      {isPending && <Spinner aria-label="찾는 중" />}
      {words && (
        <Button variant="ghost" size="icon-sm" aria-label="검색어 지우기" title="지우기" onClick={() => ask("")}>
          <XIcon />
        </Button>
      )}
    </div>
  )
  const list = (
    <CommandList className="max-h-none min-h-0 flex-1 px-2 py-3">
      {isEmpty ? (
        <PageState kind="search" isCompact title={`'${words.trim()}'에 맞는 결과가 없습니다`}
          description="페이지 · 업무 · 공지 · 회의록 · 사람 · 프로젝트의 이름으로 찾습니다." />
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map(group => (
            <section key={group.title} aria-label={group.title} className="flex flex-col gap-1">
              <header className="flex h-7 items-center justify-between px-2 text-xs font-medium text-muted-foreground">
                {group.title}
                {group.action}
              </header>
              <CommandGroup className="p-0">
                {group.rows.map(row => (
                  <CommandItem key={row.key} value={row.key} onSelect={row.onPick} className="gap-2.5">
                    {row.media ?? <row.icon chosen={row.key === active} />}
                    <span className="truncate">{row.label}</span>
                    {(row.end ?? row.where) && <CommandShortcut className="shrink-0 tracking-normal">{row.end ?? row.where}</CommandShortcut>}
                  </CommandItem>
                ))}
              </CommandGroup>
            </section>
          ))}
        </div>
      )}
    </CommandList>
  )
  const command = (children: ReactNode) => (
    <Command shouldFilter={false} loop value={active} onValueChange={setActive} className="min-h-0 flex-1 rounded-none! bg-transparent p-0">
      {children}
    </Command>
  )

  if (surface === "dialog") {
    return (
      <CommandDialog open onOpenChange={isOpen => { if (!isOpen) onClose() }} title="검색" description="페이지 · 업무 · 공지 · 회의록 · 사람 · 프로젝트를 찾습니다."
        className="top-[12%] flex max-h-[76dvh] flex-col gap-0 sm:max-w-[40rem]">
        {command(
          <>
            <div className="flex h-13 shrink-0 items-center gap-1 border-b pr-2 pl-4">
              {field}
              {onExpand && (
                <Button variant="ghost" size="icon-sm" aria-label="크게 보기" title="크게 보기" onClick={() => onExpand(words.trim())}>
                  <MaximizeIcon />
                </Button>
              )}
            </div>
            {list}
            <footer className="flex h-10 shrink-0 items-center gap-3 border-t px-4 text-xs text-muted-foreground">
              <span>↑ ↓ 고르기</span>
              <span>Enter 열기</span>
              <span>Esc 닫기</span>
            </footer>
          </>,
        )}
      </CommandDialog>
    )
  }
  if (isMobile) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {command(
          <>
            <header className="flex h-13 shrink-0 items-center gap-1 border-b px-2">
              <Button variant="ghost" size="icon" aria-label="뒤로" onClick={onClose}><ArrowLeftIcon /></Button>
              {field}
            </header>
            {list}
          </>,
        )}
      </div>
    )
  }
  return (
    <Page crumbs={[{ label: "검색", icon: SearchIcon }]}>
      {command(
        <>
          <div className="flex h-13 shrink-0 items-center border-b pr-2 pl-4">{field}</div>
          {list}
        </>,
      )}
    </Page>
  )
}
