import { useDeferredValue, useMemo, useState } from "react"
import { meetingHref, useMeetings } from "@/entities/meeting"
import { useComposeParam } from "@/shared/lib/use-compose-param"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { Button } from "@/shared/ui/button"
import { DisplayChoice, DisplayMenu } from "@/shared/ui/display-menu"
import { FilterBar, FilterChips, FilterMenu, useFilters } from "@/shared/ui/filter"
import { MeetingIcon } from "@/shared/ui/icon"
import { Page } from "@/shared/ui/page"
import { PageState } from "@/shared/ui/page-state"
import { SearchTool } from "@/shared/ui/search-tool"
import { Skeleton } from "@/shared/ui/skeleton"
import { applyFilters, DIRECTIONS, FILTERS, orderItems, type Direction } from "../model/list"
import { MeetingCompose } from "./MeetingCompose"
import { MeetingRows, MeetingTable } from "./MeetingList"

function ListSkeleton() {
  return (
    <div aria-busy="true" aria-label="회의록을 불러오는 중" className="flex flex-col">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="flex h-12.25 items-center gap-3 border-b bg-background px-4">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24 max-md:hidden" />
          <Skeleton className="h-4 w-28" />
        </div>
      ))}
    </div>
  )
}

/**
 * 회의록(호호코워크 MeetingsPage): 회의 녹음으로 만든 회의록. 프로젝트 · 상태로 거르고 회의 일시 순으로 놓는다.
 * 찾는 말은 제목과 내용(요약 · 안건 · 결정 · 할 일 · 받아쓴 원문)에서 찾는다. 데스크톱은 표, 휴대폰은 줄.
 * 새 회의록은 데스크톱에서 목록 위 대화상자, 휴대폰에서는 이 자리를 대신하는 양식 페이지다(?compose).
 */
export function MeetingsPage() {
  const isMobile = useIsMobile()
  const { data, isPending } = useMeetings()
  const filters = useFilters(FILTERS)
  const [words, setWords] = useState("")
  const query = useDeferredValue(words.trim())
  const [direction, setDirection] = useState<Direction>("desc")
  const compose = useComposeParam()

  const items = useMemo(() => orderItems(applyFilters(data ?? [], filters.state, query), direction), [data, filters.state, query, direction])
  const isNarrowed = Boolean(query) || filters.active.length > 0
  const clear = () => { filters.clear(); setWords("") }

  const composer = <MeetingCompose surface={isMobile ? "page" : "dialog"} onClose={compose.close} onSaved={id => compose.done(meetingHref(id))} />
  if (compose.isOpen && isMobile) return composer

  const body = () => {
    if (isPending) return <ListSkeleton />
    if (items.length === 0) {
      return isNarrowed
        ? <PageState kind="search" title={query ? `'${query}'에 맞는 회의록이 없습니다` : "조건에 맞는 회의록이 없습니다"}
          description="다른 말로 찾거나 필터를 바꿔 보세요." action={<Button variant="secondary" onClick={clear}>조건 지우기</Button>} />
        : <PageState kind="empty" title="아직 만든 회의록이 없습니다" description="회의 녹음을 올리면 받아쓴 내용으로 회의록이 만들어집니다."
          action={<Button variant="secondary" onClick={compose.open}>새 회의록</Button>} />
    }
    return isMobile ? <MeetingRows items={items} /> : <MeetingTable items={items} />
  }

  return (
    <Page crumbs={[{ label: "회의록", icon: MeetingIcon }]} create={{ label: "새 회의록", onClick: compose.open }}
      tools={<>
        <SearchTool label="회의록 찾기" placeholder="제목 · 내용으로 찾기" value={words} onChange={setWords} />
        <FilterMenu filters={filters} />
        <DisplayMenu isTweaked={direction !== "desc"} onReset={() => setDirection("desc")}>
          <DisplayChoice title="회의 일시" items={DIRECTIONS} value={direction} onChange={setDirection} />
        </DisplayMenu>
      </>}
      below={isMobile ? <FilterChips filters={filters} /> : <FilterBar filters={filters} />}>
      {body()}
      {compose.isOpen && composer}
    </Page>
  )
}
