import { useMemo, useState } from "react"
import { ME, useWorkItems, type WorkItemStatus } from "@/entities/work-item"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { Button } from "@/shared/ui/button"
import { PageState } from "@/shared/ui/page-state"
import {
  KanbanSquareIcon, ListIcon, ProjectsIcon, TableIcon, UserIcon,
} from "@/shared/ui/icon"
import { Page, PageViews, type PageView } from "@/shared/ui/page"
import { Skeleton } from "@/shared/ui/skeleton"
import { FilterBar, FilterChips, FilterMenu, useFilters } from "@/shared/ui/filter"
import { applyFilters, FILTERS, groupItems, INITIAL_DISPLAY, sortItems, type Display } from "../model/filters"
import { NewWorkItemDialog } from "./NewWorkItemDialog"
import { WorkItemDisplayMenu } from "./WorkItemDisplayMenu"
import { WorkItemsPageMenu } from "./WorkItemMenu"
import { WorkItemBoard } from "./WorkItemBoard"
import { Rows, WorkItemListView } from "./WorkItemListView"
import { WorkItemTable } from "./WorkItemTable"

type View = "all" | "board" | "table" | "mine"

const VIEWS: PageView<View>[] = [
  { value: "all", label: "전체 업무", icon: ListIcon },
  { value: "board", label: "보드", icon: KanbanSquareIcon },
  { value: "table", label: "표", icon: TableIcon },
  { value: "mine", label: "내 업무", icon: UserIcon },
]

function ListSkeleton() {
  return (
    <div aria-busy="true" aria-label="업무를 불러오는 중" className="flex flex-col">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="flex h-12.25 items-center gap-3 border-b bg-background px-4">
          <Skeleton className="size-4" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-40 max-md:hidden" />
        </div>
      ))}
    </div>
  )
}

/**
 * 프로젝트 cowork의 업무(호호코워크 ProjectWorkItemsPage). 뷰 네 개(리스트 · 보드 · 표 · 내 업무)와 필터 · 표시 도구,
 * 걸린 필터 줄, 새 업무. 필터와 표시는 서버가 하듯 여기서 걸러 정렬한다.
 */
export function WorkItemsPage() {
  const isMobile = useIsMobile()
  const { data, isPending } = useWorkItems()
  const filters = useFilters(FILTERS)
  const [display, setDisplay] = useState<Display>(INITIAL_DISPLAY)
  const [view, setView] = useState<View>("all")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [create, setCreate] = useState<{ isOpen: boolean; status: WorkItemStatus }>({ isOpen: false, status: "todo" })
  const openCreate = (status: WorkItemStatus = "todo") => setCreate({ isOpen: true, status })

  const items = useMemo(() => {
    const shown = sortItems(applyFilters(data ?? [], filters.state), display)
    return view === "mine" ? shown.filter(item => item.assignee?.id === ME.id) : shown
  }, [data, filters.state, display, view])
  const isNarrowed = filters.active.length > 0

  const below = isMobile ? <FilterChips filters={filters} /> : <FilterBar filters={filters} />

  const body = () => {
    if (isPending) return <ListSkeleton />
    if (items.length === 0) {
      return (
        <PageState kind={isNarrowed ? "search" : "empty"}
          title={isNarrowed ? "조건에 맞는 업무가 없습니다" : "아직 업무가 없습니다"}
          description={isNarrowed ? "필터를 바꾸거나 지워 보세요." : "새 업무로 이 프로젝트의 할 일이나 버그를 남겨 보세요."}
          action={isNarrowed
            ? <Button variant="secondary" onClick={filters.clear}>필터 지우기</Button>
            : <Button variant="create" onClick={() => openCreate()}>새 업무</Button>} />
      )
    }
    if (view === "board") return <WorkItemBoard items={items} onCreateIn={openCreate} />
    if (view === "table") {
      // 휴대폰의 표는 묶지 않은 목록이다(호호코워크와 같이).
      if (isMobile) return <Rows items={items} isCompact />
      return (
        <div className="flex min-h-0 flex-1 flex-col *:data-[slot=table-container]:min-h-0 *:data-[slot=table-container]:flex-1">
          <WorkItemTable items={items} selected={selected} onSelectedChange={setSelected} />
        </div>
      )
    }
    return (
      <WorkItemListView groups={groupItems(items, display.group)} isCompact={isMobile}
        onCreateIn={display.group === "status" ? id => openCreate(id as WorkItemStatus) : undefined} />
    )
  }

  return (
    <Page
      crumbs={[{ label: "프로젝트" }, { label: "cowork", icon: ProjectsIcon }, { label: "업무", icon: KanbanSquareIcon }]}
      actions={<WorkItemsPageMenu />}
      create={{ label: "새 업무", onClick: () => openCreate() }}
      views={<PageViews label="업무 뷰" views={VIEWS} value={view} onChange={setView} />}
      tools={<><FilterMenu filters={filters} /><WorkItemDisplayMenu value={display} onChange={setDisplay} /></>}
      below={below}>
      {body()}
      <NewWorkItemDialog key={create.status} open={create.isOpen} status={create.status}
        onOpenChange={isOpen => setCreate(current => ({ ...current, isOpen }))} />
    </Page>
  )
}
