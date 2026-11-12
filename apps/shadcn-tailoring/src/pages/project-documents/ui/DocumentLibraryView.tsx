import { useDeferredValue, useMemo, useState } from "react"
import type { DocumentLibrary } from "@/entities/document"
import { paths, projectPath } from "@/shared/config"
import { useComposeParam } from "@/shared/lib/use-compose-param"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { Button } from "@/shared/ui/button"
import { DisplayChoice, DisplayMenu } from "@/shared/ui/display-menu"
import { FilterBar, FilterChips, FilterMenu, useFilters } from "@/shared/ui/filter"
import { FileTextIcon, FolderWithFilesIcon, ListFilterIcon, ProjectsIcon } from "@/shared/ui/icon"
import { Page, PageViews, type Crumb, type PageView } from "@/shared/ui/page"
import { PageState } from "@/shared/ui/page-state"
import { SearchTool } from "@/shared/ui/search-tool"
import { Skeleton } from "@/shared/ui/skeleton"
import { DIRECTIONS, LAYOUTS, SORTS, applyFilters, displayOf, filtersOf, orderDocuments, type Display } from "../model/library"
import { DocumentCompose } from "./DocumentCompose"
import { DocumentGrid, DocumentRows } from "./DocumentList"

const ALL = "all"

function GridSkeleton() {
  return (
    <div aria-busy="true" aria-label="문서를 불러오는 중" className="mx-auto grid w-full max-w-288 grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-3 p-4">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex flex-col overflow-hidden rounded-xl border bg-card">
          <Skeleton className="h-40 rounded-none" />
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** 표시: 보기 · 정렬 기준 · 방향(기준에 맞는 말). 뷰가 정한 처음 값과 다르면 점이 붙는다. */
function LibraryDisplayMenu({ value, initial, onChange }: { value: Display; initial: Display; onChange: (value: Display) => void }) {
  const [asc, desc] = DIRECTIONS[SORTS.find(sort => sort.value === value.sort)?.kind ?? "rank"]
  const isTweaked = value.layout !== initial.layout || value.sort !== initial.sort || value.direction !== initial.direction
  return (
    <DisplayMenu isTweaked={isTweaked} onReset={() => onChange(initial)}>
      <DisplayChoice title="보기" items={LAYOUTS} value={value.layout} onChange={layout => onChange({ ...value, layout })} />
      <DisplayChoice title="정렬 기준" items={SORTS} value={value.sort} onChange={sort => onChange({ ...value, sort })} />
      <DisplayChoice title="방향" items={[{ value: "asc", label: asc }, { value: "desc", label: desc }] as const} value={value.direction}
        onChange={direction => onChange({ ...value, direction })} />
    </DisplayMenu>
  )
}

/**
 * 프로젝트 문서함(호호코워크 ProjectLibrary의 목록): 뷰(전체 문서 · 저장한 뷰), 찾기(제목 · 내용) · 문서 라벨 필터 · 표시(보기 · 정렬),
 * 새 문서. 맨 위 문서만 카드(그리드)나 줄(리스트)로 서고, 하위 페이지는 문서를 열어 목차로 오간다.
 * 저장한 뷰를 고르면 그 뷰의 라벨 · 보기 · 정렬로 바뀐다. 새 문서는 데스크톱에서 대화상자, 휴대폰에서는 이 자리를 대신하는 양식이다(?compose).
 */
export function DocumentLibraryView({ projectKey, projectName, library }: { projectKey: string; projectName: string; library?: DocumentLibrary }) {
  const isMobile = useIsMobile()
  const compose = useComposeParam()
  const filters = useFilters(filtersOf(library?.labels ?? []))
  const [viewId, setViewId] = useState(ALL)
  const view = library?.views.find(each => each.id === viewId)
  const initial = displayOf(view)
  const [display, setDisplay] = useState<Display>(initial)
  const [words, setWords] = useState("")
  const query = useDeferredValue(words.trim())

  const shown = useMemo(() => orderDocuments(applyFilters(library?.documents ?? [], filters.state, query), display),
    [library, filters.state, query, display])

  const pickView = (id: string) => {
    const next = library?.views.find(each => each.id === id)
    setViewId(id)
    setDisplay(displayOf(next))
    filters.clear()
    if (next?.labelIds.length) filters.change("label", next.labelIds)
  }
  const clear = () => { filters.clear(); setWords("") }

  const base = projectPath(projectKey, "documents")
  const composer = library && (
    <DocumentCompose projectKey={projectKey} projectName={projectName} labels={library.labels} surface={isMobile ? "page" : "dialog"}
      onClose={compose.close} onSaved={id => compose.done(`${base}/${id}`)} />
  )
  if (compose.isOpen && isMobile && composer) return composer

  const views: PageView<string>[] = [
    { value: ALL, label: "전체 문서", icon: FileTextIcon },
    ...(library?.views ?? []).map(each => ({ value: each.id, label: each.name, icon: ListFilterIcon })),
  ]
  const crumbs: Crumb[] = [
    { label: "프로젝트", href: paths.projects },
    { label: projectName, icon: ProjectsIcon, href: projectPath(projectKey) },
    { label: "문서", icon: FolderWithFilesIcon },
  ]

  const body = () => {
    if (!library) return <GridSkeleton />
    if (shown.length === 0) {
      if (query || filters.active.length > 0) {
        return <PageState kind="search" title={query ? `'${query}'에 맞는 문서가 없습니다` : "조건에 맞는 문서가 없습니다"}
          description="다른 말로 찾거나 라벨을 바꿔 보세요." action={<Button variant="secondary" onClick={clear}>조건 지우기</Button>} />
      }
      return <PageState kind="empty" title="아직 문서가 없습니다" description="설계 · 회의 정리 · 운영 매뉴얼처럼 남겨 둘 글을 이 프로젝트에 모아 두세요."
        action={<Button variant="secondary" onClick={compose.open}>새 문서</Button>} />
    }
    return display.layout === "grid"
      ? <DocumentGrid projectKey={projectKey} documents={shown} labels={library.labels} />
      : <DocumentRows projectKey={projectKey} documents={shown} labels={library.labels} />
  }

  return (
    <Page crumbs={crumbs} create={{ label: "새 문서", onClick: compose.open }}
      views={views.length > 1 && <PageViews label="문서 뷰" views={views} value={viewId} onChange={pickView} />}
      tools={<>
        <SearchTool label="문서 찾기" placeholder="제목 · 내용으로 찾기" value={words} onChange={setWords} />
        <FilterMenu filters={filters} />
        <LibraryDisplayMenu value={display} initial={initial} onChange={setDisplay} />
      </>}
      below={isMobile ? <FilterChips filters={filters} /> : <FilterBar filters={filters} />}>
      {body()}
      {compose.isOpen && composer}
    </Page>
  )
}
