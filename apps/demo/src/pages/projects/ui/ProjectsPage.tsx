import { useMemo, useState } from "react"
import { useProjects } from "@/entities/project"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { ActionMenu } from "@/shared/ui/action-menu"
import { Button } from "@/shared/ui/button"
import { DisplayChoice, DisplayMenu } from "@/shared/ui/display-menu"
import { FilterBar, FilterChips, FilterMenu, useFilters } from "@/shared/ui/filter"
import { ArchiveIcon, KanbanSquareIcon, LinkIcon, ListIcon, ProjectsIcon } from "@/shared/ui/icon"
import { Page, PageViews, type PageView } from "@/shared/ui/page"
import { PageState } from "@/shared/ui/page-state"
import { Skeleton } from "@/shared/ui/skeleton"
import { toast } from "@/shared/ui/toast"
import { applyFilters, DIRECTIONS, FILTERS, INITIAL_DISPLAY, SORTS, sortProjects, type Display, type View } from "../model/view"
import { NewProject } from "./NewProject"
import { ProjectBoard } from "./ProjectBoard"
import { ProjectRow } from "./ProjectRow"

const VIEWS: PageView<View>[] = [
  { value: "active", label: "진행 중", icon: ListIcon },
  { value: "board", label: "보드", icon: KanbanSquareIcon },
  { value: "archived", label: "보관함", icon: ArchiveIcon },
]

/** 표시: 정렬 기준과 기준에 맞는 말로 쓴 방향. */
function ProjectDisplayMenu({ value, onChange }: { value: Display; onChange: (value: Display) => void }) {
  const [asc, desc] = DIRECTIONS[SORTS.find(sort => sort.value === value.sort)?.kind ?? "rank"]
  return (
    <DisplayMenu isTweaked={value.sort !== INITIAL_DISPLAY.sort || value.direction !== INITIAL_DISPLAY.direction} onReset={() => onChange(INITIAL_DISPLAY)}>
      <DisplayChoice title="정렬 기준" items={SORTS} value={value.sort} onChange={sort => onChange({ ...value, sort })} />
      <DisplayChoice title="방향" items={[{ value: "asc", label: asc }, { value: "desc", label: desc }] as const} value={value.direction}
        onChange={direction => onChange({ ...value, direction })} />
    </DisplayMenu>
  )
}

/** 머리 줄의 페이지 메뉴(…). */
function ProjectsPageMenu() {
  return (
    <ActionMenu label="프로젝트 메뉴" actions={[{
      label: "링크 복사", icon: LinkIcon, onSelect: () => void navigator.clipboard.writeText(location.href).then(
        () => toast.add({ type: "success", title: "링크를 복사했습니다" }),
        () => toast.add({ type: "error", title: "복사하지 못했습니다" }),
      ),
    }]} />
  )
}

function ListSkeleton() {
  return (
    <div aria-busy="true" aria-label="프로젝트를 불러오는 중" className="flex flex-col">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex h-14 items-center gap-3 border-b bg-background px-4">
          <Skeleton className="size-7 rounded-lg" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-60 max-md:hidden" />
        </div>
      ))}
    </div>
  )
}

/**
 * 프로젝트(호호코워크 ProjectsPage · 플레이그라운드 레이아웃 화면): 뷰 진행 중 · 보드 · 보관함, 필터(즐겨찾기 · 리드)와 표시(정렬),
 * 새 프로젝트. 줄은 표식 · 이름 · 키 · 리드 · 진행률 · 멤버 수 · 별표이고, 누르면 업무로 간다.
 */
export function ProjectsPage() {
  const isMobile = useIsMobile()
  const { data, isPending } = useProjects()
  const filters = useFilters(FILTERS)
  const [display, setDisplay] = useState<Display>(INITIAL_DISPLAY)
  const [view, setView] = useState<View>("active")
  const [isCreating, setCreating] = useState(false)

  const projects = useMemo(() => sortProjects(applyFilters(data ?? [], filters.state), display), [data, filters.state, display])
  // 휴대폰의 새 프로젝트는 목록 대신 전체 화면 페이지다.
  if (isCreating && isMobile) return <NewProject onClose={() => setCreating(false)} />

  const isNarrowed = filters.active.length > 0
  const shown = view === "board" ? projects : projects.filter(project => project.status === (view === "archived" ? "archived" : "active"))
  const body = () => {
    if (isPending) return <ListSkeleton />
    if (shown.length === 0) {
      if (isNarrowed) {
        return <PageState kind="search" title="조건에 맞는 프로젝트가 없습니다" description="필터를 바꾸거나 지워 보세요."
          action={<Button variant="secondary" onClick={filters.clear}>필터 지우기</Button>} />
      }
      return view === "archived"
        ? <PageState kind="empty" title="보관한 프로젝트가 없습니다" description="끝난 프로젝트를 보관하면 여기에 모입니다." />
        : <PageState kind="empty" title="아직 프로젝트가 없습니다" description="새 프로젝트로 회사의 첫 프로젝트를 만들어 보세요."
          action={<Button variant="create" onClick={() => setCreating(true)}>새 프로젝트</Button>} />
    }
    if (view === "board") return <ProjectBoard projects={shown} />
    return (
      <ul aria-label="프로젝트" className="flex flex-col">
        {shown.map(project => <ProjectRow key={project.id} project={project} isCompact={isMobile} />)}
      </ul>
    )
  }

  return (
    <Page crumbs={[{ label: "프로젝트", icon: ProjectsIcon }]}
      actions={<ProjectsPageMenu />}
      create={{ label: "새 프로젝트", onClick: () => setCreating(true) }}
      views={<PageViews label="프로젝트 뷰" views={VIEWS} value={view} onChange={setView} />}
      tools={<><FilterMenu filters={filters} /><ProjectDisplayMenu value={display} onChange={setDisplay} /></>}
      below={isMobile ? <FilterChips filters={filters} /> : <FilterBar filters={filters} />}>
      {body()}
      {isCreating && <NewProject onClose={() => setCreating(false)} />}
    </Page>
  )
}
