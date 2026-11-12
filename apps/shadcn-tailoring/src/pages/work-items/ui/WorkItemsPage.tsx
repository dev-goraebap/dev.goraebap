import { useNavigate, useSearch } from "@tanstack/react-router"
import { useEffect, useMemo, useState } from "react"
import { useCurrentProject } from "@/entities/project"
import { ME, useStatusColumns, useWorkItems } from "@/entities/work-item"
import { useNewWorkItemPanel, useOpenNewWorkItem, WorkItemCompose } from "@/features/work-item-create"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { paths, projectPath } from "@/shared/config"
import { Button } from "@/shared/ui/button"
import { PageState } from "@/shared/ui/page-state"
import { KanbanSquareIcon, ProjectsIcon } from "@/shared/ui/icon"
import { Page, PageViews } from "@/shared/ui/page"
import { Skeleton } from "@/shared/ui/skeleton"
import { FilterBar, FilterChips, FilterMenu, useFilters } from "@/shared/ui/filter"
import { applyFilters, filtersOf, groupItems, INITIAL_DISPLAY, sortItems, type Display } from "../model/filters"
import { parseView, VIEWS, withView, type View } from "../model/view"
import { WorkItemDisplayMenu } from "./WorkItemDisplayMenu"
import { WorkItemsPageMenu } from "./WorkItemMenu"
import { WorkItemBoard } from "./WorkItemBoard"
import { Rows, WorkItemListView } from "./WorkItemListView"
import { WorkItemTable } from "./WorkItemTable"

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
 * 프로젝트 하나의 업무(호호코워크 ProjectWorkItemsPage, /projects/$projectKey/work-items). 뷰 네 개(리스트 · 보드 · 표 · 내 업무, 주소의 ?view)와 필터 · 표시 도구,
 * 걸린 필터 줄, 새 업무. 필터와 표시는 서버가 하듯 여기서 걸러 정렬한다.
 */
export function WorkItemsPage() {
  const isMobile = useIsMobile()
  const { key: projectKey, project } = useCurrentProject()
  const { data, isPending } = useWorkItems(projectKey)
  // 보드의 칸 · 상태 필터 · 상태 묶음은 프로젝트의 워크플로를 따른다(설정에서 고치면 바로 바뀐다).
  const columns = useStatusColumns(projectKey)
  const filterDefs = useMemo(() => filtersOf(columns), [columns])
  const filters = useFilters(filterDefs)
  const [display, setDisplay] = useState<Display>(INITIAL_DISPLAY)
  const navigate = useNavigate()
  const view = parseView(useSearch({ strict: false }) as Record<string, unknown>)
  // 뷰를 바꾸면 기록에 남는다: 뒤로 가기가 앞의 뷰로, 사이드바의 줄과 같은 주소다.
  const setView = (next: View) => void navigate({ to: projectPath(projectKey), search: (current: Record<string, unknown>) => withView(current, next) as never })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const openCreate = useOpenNewWorkItem()
  const panel = useNewWorkItemPanel()
  // 휴대폰에는 대화상자가 없다: 열린 채 좁아지면 같은 양식을 페이지로 바꾼다.
  const shouldExpand = panel.isOpen && isMobile
  const expandPanel = panel.expand
  useEffect(() => { if (shouldExpand) expandPanel() }, [shouldExpand])

  const items = useMemo(() => {
    const shown = sortItems(applyFilters(data ?? [], filters.state, columns), display)
    return view === "mine" ? shown.filter(item => item.assignee?.id === ME.id) : shown
  }, [data, filters.state, columns, display, view])
  const isNarrowed = filters.active.length > 0

  const below = isMobile ? <FilterChips filters={filters} /> : <FilterBar filters={filters} />

  const body = () => {
    if (isPending || project === undefined) return <ListSkeleton />
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
    if (view === "board") return <WorkItemBoard items={items} columns={columns} onCreateIn={openCreate} />
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
      <WorkItemListView groups={groupItems(items, display.group, columns)} isCompact={isMobile}
        onCreateIn={display.group === "status" ? openCreate : undefined} />
    )
  }

  return (
    <Page
      crumbs={[{ label: "프로젝트", href: paths.projects }, { label: project?.name ?? projectKey, icon: ProjectsIcon }, { label: "업무", icon: KanbanSquareIcon }]}
      actions={<WorkItemsPageMenu />}
      create={{ label: "새 업무", onClick: () => openCreate() }}
      views={<PageViews label="업무 뷰" views={VIEWS} value={view} onChange={setView} />}
      tools={<><FilterMenu filters={filters} /><WorkItemDisplayMenu value={display} onChange={setDisplay} /></>}
      below={below}>
      {body()}
      {panel.isOpen && !isMobile && (
        <WorkItemCompose key={panel.status} projectKey={projectKey} surface="dialog" status={panel.status}
          onClose={panel.close} onExpand={panel.expand} onCreated={item => panel.done(item.key)} />
      )}
    </Page>
  )
}
