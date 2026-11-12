import { useDeferredValue, useMemo, useState } from "react"
import { announcementHref, useAnnouncements } from "@/entities/announcement"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { Button } from "@/shared/ui/button"
import { FilterBar, FilterChips, FilterMenu, useFilters } from "@/shared/ui/filter"
import { MegaphoneIcon } from "@/shared/ui/icon"
import { Page } from "@/shared/ui/page"
import { PageState } from "@/shared/ui/page-state"
import { SearchTool } from "@/shared/ui/search-tool"
import { Skeleton } from "@/shared/ui/skeleton"
import { NEW_HREF } from "../model/address"
import { applyFilters, FILTERS, INITIAL_DISPLAY, orderItems, type Display } from "../model/list"
import { AnnouncementCompose } from "./AnnouncementCompose"
import { useOpenPanel, usePanel } from "@/shared/lib/panel"
import { AnnouncementDisplayMenu } from "./AnnouncementDisplayMenu"
import { AnnouncementRows, AnnouncementTable } from "./AnnouncementList"

function ListSkeleton() {
  return (
    <div aria-busy="true" aria-label="공지를 불러오는 중" className="flex flex-col">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="flex h-12.25 items-center gap-3 border-b bg-background px-4">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24 max-md:hidden" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  )
}

/**
 * 공지사항(호호코워크 AnnouncementsPage): 모든 구성원에게 내는 공지. 고정 공지가 앞에 서고 나머지는 게시일 순, 읽지 않은 것은 굵게.
 * 제목으로 찾고, 읽음 · 분류 · 게시일 · 작성자 · 첨부로 거르고, 게시일 · 제목으로 정렬한다. 데스크톱은 표, 휴대폰은 줄.
 * 새 공지(/announcements/new)는 데스크톱에서 목록 위 대화상자(주소창에는 그 페이지 주소), 휴대폰은 그 페이지로 간다.
 * 게시하면 그 공지의 상세가 대화상자 자리를 대신한다.
 */
export function AnnouncementsPage() {
  const isMobile = useIsMobile()
  const { data, isPending } = useAnnouncements()
  const filters = useFilters(FILTERS)
  const [words, setWords] = useState("")
  const query = useDeferredValue(words.trim())
  const [display, setDisplay] = useState<Display>(INITIAL_DISPLAY)
  const openPanel = useOpenPanel()
  const panel = usePanel()
  const compose = () => openPanel(NEW_HREF)

  const items = useMemo(
    () => orderItems(applyFilters(data ?? [], filters.state, query), display, Boolean(query)),
    [data, filters.state, query, display],
  )
  const isNarrowed = Boolean(query) || filters.active.length > 0
  const clear = () => { filters.clear(); setWords("") }

  const body = () => {
    if (isPending) return <ListSkeleton />
    if (items.length === 0) {
      return isNarrowed
        ? <PageState kind="search" title="조건에 맞는 공지가 없습니다" description="찾는 말이나 필터를 바꿔 보세요."
          action={<Button variant="secondary" onClick={clear}>조건 지우기</Button>} />
        : <PageState kind="empty" title="게시된 공지가 없습니다" description="새 공지가 올라오면 여기에 보입니다. 모든 구성원이 공지를 쓸 수 있습니다."
          action={<Button variant="secondary" onClick={compose}>새 공지 쓰기</Button>} />
    }
    return isMobile ? <AnnouncementRows items={items} /> : <AnnouncementTable items={items} />
  }

  return (
    <Page crumbs={[{ label: "공지사항", icon: MegaphoneIcon }]} create={{ label: "새 공지", onClick: compose }}
      tools={<>
        <SearchTool label="공지 찾기" placeholder="제목으로 찾기" value={words} onChange={setWords} />
        <FilterMenu filters={filters} />
        <AnnouncementDisplayMenu value={display} onChange={setDisplay} />
      </>}
      below={isMobile ? <FilterChips filters={filters} /> : <FilterBar filters={filters} />}>
      {body()}
      {panel.pathname === NEW_HREF && (
        <AnnouncementCompose surface="dialog" onClose={panel.close} onExpand={panel.expand} onSaved={id => panel.done(announcementHref(id))} />
      )}
    </Page>
  )
}
