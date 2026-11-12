import { useDeferredValue, useMemo, useState } from "react"
import { meetingHref, useMeeting, useMeetings } from "@/entities/meeting"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { Button } from "@/shared/ui/button"
import { DisplayChoice, DisplayMenu } from "@/shared/ui/display-menu"
import { FilterBar, FilterChips, FilterMenu, useFilters } from "@/shared/ui/filter"
import { MeetingIcon } from "@/shared/ui/icon"
import { Page } from "@/shared/ui/page"
import { PageState } from "@/shared/ui/page-state"
import { SearchTool } from "@/shared/ui/search-tool"
import { Skeleton } from "@/shared/ui/skeleton"
import { editMeetingHref, newMeetingHref, panelTarget, projectFrom } from "../model/address"
import { applyFilters, DIRECTIONS, FILTERS, orderItems, type Direction } from "../model/list"
import { useOpenPanel, usePanel } from "@/shared/lib/panel"
import { MeetingCompose } from "./MeetingCompose"
import { MeetingRows, MeetingTable } from "./MeetingList"
import { MeetingSurface } from "./MeetingPage"

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

/** 대화상자 자리에서 고치는 회의록. 회의록을 읽은 뒤에 양식을 그린다. 닫거나 저장하면 그 회의록으로 돌아간다. */
function EditPanel({ id }: { id: string }) {
  const { data: meeting } = useMeeting(id)
  const panel = usePanel()
  const openPanel = useOpenPanel()
  const back = () => openPanel(meetingHref(id), { replace: true })
  if (!meeting) return null
  return <MeetingCompose key={meeting.id} meeting={meeting} surface="dialog" onClose={back} onExpand={panel.expand} onSaved={back} />
}

/**
 * 목록 위에 열린 것(호호코워크 PanelHost의 회의록 몫): 새 회의록, 줄이 연 회의록 하나, 그 회의록에서 연 수정(?compose).
 * 만들면 그 회의록의 상세가 대화상자 자리를 대신한다.
 */
function MeetingPanel() {
  const panel = usePanel()
  const openPanel = useOpenPanel()
  const target = panelTarget(panel.pathname, panel.search)
  if (!panel.href || !target) return null
  if (target.kind === "new") {
    return (
      <MeetingCompose key={panel.href} project={projectFrom(panel.search)} surface="dialog"
        onClose={panel.close} onExpand={panel.expand} onSaved={id => panel.done(meetingHref(id))} />
    )
  }
  if (target.kind === "edit") return <EditPanel key={panel.href} id={target.id} />
  return (
    <MeetingSurface key={panel.href} id={target.id} surface="dialog" onClose={panel.close} onExpand={panel.expand}
      onEdit={() => openPanel(editMeetingHref(target.id))} />
  )
}

/**
 * 회의록(호호코워크 MeetingsPage): 회의 녹음으로 만든 회의록. 프로젝트 · 상태로 거르고 회의 일시 순으로 놓는다.
 * 찾는 말은 제목과 내용(요약 · 안건 · 결정 · 할 일 · 받아쓴 원문)에서 찾는다. 데스크톱은 표, 휴대폰은 줄.
 * 회의록 하나(/meetings/{id})와 새 회의록(/meetings/new)은 데스크톱에서 목록 위 대화상자(주소창에는 그 페이지 주소),
 * 휴대폰은 그 페이지로 간다. 새 회의록은 한 프로젝트로 걸러 두었으면 그 프로젝트로 시작한다.
 */
export function MeetingsPage() {
  const isMobile = useIsMobile()
  const { data, isPending } = useMeetings()
  const filters = useFilters(FILTERS)
  const [words, setWords] = useState("")
  const query = useDeferredValue(words.trim())
  const [direction, setDirection] = useState<Direction>("desc")
  const openPanel = useOpenPanel()
  const { project = [] } = filters.state
  const compose = () => openPanel(newMeetingHref(project.length === 1 ? project[0] : undefined))

  const items = useMemo(() => orderItems(applyFilters(data ?? [], filters.state, query), direction), [data, filters.state, query, direction])
  const isNarrowed = Boolean(query) || filters.active.length > 0
  const clear = () => { filters.clear(); setWords("") }

  const body = () => {
    if (isPending) return <ListSkeleton />
    if (items.length === 0) {
      return isNarrowed
        ? <PageState kind="search" title={query ? `'${query}'에 맞는 회의록이 없습니다` : "조건에 맞는 회의록이 없습니다"}
          description="다른 말로 찾거나 필터를 바꿔 보세요." action={<Button variant="secondary" onClick={clear}>조건 지우기</Button>} />
        : <PageState kind="empty" title="아직 만든 회의록이 없습니다" description="회의 녹음을 올리면 받아쓴 내용으로 회의록이 만들어집니다."
          action={<Button variant="secondary" onClick={compose}>새 회의록</Button>} />
    }
    return isMobile ? <MeetingRows items={items} /> : <MeetingTable items={items} />
  }

  return (
    <Page crumbs={[{ label: "회의록", icon: MeetingIcon }]} create={{ label: "새 회의록", onClick: compose }}
      tools={<>
        <SearchTool label="회의록 찾기" placeholder="제목 · 내용으로 찾기" value={words} onChange={setWords} />
        <FilterMenu filters={filters} />
        <DisplayMenu isTweaked={direction !== "desc"} onReset={() => setDirection("desc")}>
          <DisplayChoice title="회의 일시" items={DIRECTIONS} value={direction} onChange={setDirection} />
        </DisplayMenu>
      </>}
      below={isMobile ? <FilterChips filters={filters} /> : <FilterBar filters={filters} />}>
      {body()}
      <MeetingPanel />
    </Page>
  )
}
