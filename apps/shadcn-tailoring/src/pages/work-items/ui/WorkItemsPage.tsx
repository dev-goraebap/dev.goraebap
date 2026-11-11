import { useMemo, useState } from "react"
import { ME, useWorkItems, type WorkItemStatus } from "@/entities/work-item"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { AdaptivePopover } from "@/shared/ui/adaptive-popover"
import { Button } from "@/shared/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty"
import {
  KanbanSquareIcon, LinkIcon, ListIcon, MoreHorizontalIcon, ProjectsIcon, SearchXIcon, TableIcon, UserIcon,
} from "@/shared/ui/icon"
import { Page, PageViews, type PageView } from "@/shared/ui/page"
import { Skeleton } from "@/shared/ui/skeleton"
import { toast } from "@/shared/ui/toast"
import { activeKeys, applyFilters, groupItems, sortItems } from "../model/filters"
import { useWorkItemFilters } from "../model/use-work-item-filters"
import { DisplayMenu } from "./DisplayMenu"
import { FilterBar, FilterChips } from "./FilterBar"
import { FilterMenu } from "./FilterMenu"
import { NewWorkItemDialog } from "./NewWorkItemDialog"
import { OptionList } from "./OptionList"
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

/** 머리 줄의 페이지 메뉴(…). */
function PageMenu() {
  const [isOpen, setOpen] = useState(false)
  return (
    <AdaptivePopover title="업무 메뉴" align="end" className="w-48 p-1.5" open={isOpen} onOpenChange={setOpen}
      trigger={<Button variant="ghost" size="icon-xs" aria-label="업무 메뉴" className="max-md:size-9"><MoreHorizontalIcon /></Button>}>
      <OptionList label="업무 메뉴" options={[{ value: "link", label: "링크 복사", icon: <LinkIcon /> }]}
        onPick={() => {
          setOpen(false)
          navigator.clipboard.writeText(location.href).then(() => toast.add({ type: "success", title: "링크를 복사했습니다" }), () => {})
        }} />
    </AdaptivePopover>
  )
}

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
  const filters = useWorkItemFilters()
  const [view, setView] = useState<View>("all")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [create, setCreate] = useState<{ isOpen: boolean; status: WorkItemStatus }>({ isOpen: false, status: "todo" })
  const openCreate = (status: WorkItemStatus = "todo") => setCreate({ isOpen: true, status })

  const items = useMemo(() => {
    const shown = sortItems(applyFilters(data ?? [], filters.state), filters.display)
    return view === "mine" ? shown.filter(item => item.assignee?.id === ME.id) : shown
  }, [data, filters.state, filters.display, view])
  const isNarrowed = activeKeys(filters.state).length > 0

  const below = isMobile
    ? <FilterChips filters={filters} />
    : filters.shown.length > 0 ? <FilterBar filters={filters} /> : undefined

  const body = () => {
    if (isPending) return <ListSkeleton />
    if (items.length === 0) {
      return (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><SearchXIcon /></EmptyMedia>
            <EmptyTitle>{isNarrowed ? "조건에 맞는 업무가 없습니다" : "아직 업무가 없습니다"}</EmptyTitle>
            <EmptyDescription>{isNarrowed ? "필터를 바꾸거나 지워 보세요." : "새 업무로 이 프로젝트의 할 일이나 버그를 남겨 보세요."}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {isNarrowed
              ? <Button variant="secondary" onClick={filters.clear}>필터 지우기</Button>
              : <Button variant="create" onClick={() => openCreate()}>새 업무</Button>}
          </EmptyContent>
        </Empty>
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
      <WorkItemListView groups={groupItems(items, filters.display.group)} isCompact={isMobile}
        onCreateIn={filters.display.group === "status" ? id => openCreate(id as WorkItemStatus) : undefined} />
    )
  }

  return (
    <Page
      crumbs={[{ label: "프로젝트" }, { label: "cowork", icon: ProjectsIcon }, { label: "업무", icon: KanbanSquareIcon }]}
      actions={<PageMenu />}
      create={{ label: "새 업무", onClick: () => openCreate() }}
      views={<PageViews label="업무 뷰" views={VIEWS} value={view} onChange={setView} />}
      tools={<><FilterMenu filters={filters} /><DisplayMenu value={filters.display} onChange={filters.setDisplay} /></>}
      below={below}>
      {body()}
      <NewWorkItemDialog key={create.status} open={create.isOpen} status={create.status}
        onOpenChange={isOpen => setCreate(current => ({ ...current, isOpen }))} />
    </Page>
  )
}
