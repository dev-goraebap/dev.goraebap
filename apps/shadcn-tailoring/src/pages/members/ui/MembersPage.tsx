import { useEffect, useMemo, useState } from "react"
import { useMembers } from "@/entities/member"
import { useDialogMember, useProfileRoute } from "@/shared/lib/profile-route"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { Button } from "@/shared/ui/button"
import { FilterBar, FilterChips, FilterMenu, useFilters } from "@/shared/ui/filter"
import { ListIcon, StructureIcon, UsersIcon } from "@/shared/ui/icon"
import { Page, PageViews, type PageView } from "@/shared/ui/page"
import { SearchTool } from "@/shared/ui/search-tool"
import { PageState } from "@/shared/ui/page-state"
import { Skeleton } from "@/shared/ui/skeleton"
import { ProfileDialog } from "@/widgets/person-profile"
import { memberFilters, visibleMembers } from "../model/filters"
import { MemberList } from "./MemberList"
import { MembersTable } from "./MembersTable"
import { OrgChart } from "./OrgChart"

type View = "list" | "chart"

const VIEWS: PageView<View>[] = [
  { value: "list", label: "목록", icon: ListIcon },
  { value: "chart", label: "조직도", icon: StructureIcon },
]

function ListSkeleton() {
  return (
    <div aria-busy="true" aria-label="구성원을 불러오는 중" className="flex flex-col">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="flex h-12.25 items-center gap-3 border-b bg-background px-4">
          <Skeleton className="size-6 rounded-full max-md:size-9" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28 max-md:hidden" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  )
}

/**
 * 구성원(호호코워크 MembersPage): 목록 · 조직도 두 뷰. 목록은 찾기 · 부서 · 상태로 좁히고, 데스크톱은 표, 휴대폰은
 * 부서별 줄. 조직도는 부서 피라미드. 사람을 누르면 데스크톱은 목록 위 프로필 대화상자(주소는 /members/{id}),
 * 휴대폰은 프로필 페이지.
 */
export function MembersPage() {
  const isMobile = useIsMobile()
  const { data, isPending } = useMembers()
  const members = useMemo(() => data ?? [], [data])
  const filters = useFilters(useMemo(() => memberFilters(members), [members]))
  const [view, setView] = useState<View>("list")
  const [query, setQuery] = useState("")
  const profile = useProfileRoute()
  const dialogMember = useDialogMember()

  // 대화상자를 연 채 휴대폰 폭이 되면 그 프로필의 페이지로 옮긴다(휴대폰은 늘 페이지).
  useEffect(() => {
    if (isMobile && dialogMember) void profile.page(dialogMember, true)
  }, [isMobile, dialogMember, profile])

  const shown = useMemo(() => visibleMembers(members, filters.state, query), [members, filters.state, query])
  const isNarrowed = filters.active.length > 0 || query.trim() !== ""
  const clear = () => { filters.clear(); setQuery("") }
  const isList = view === "list"

  const below = isList ? (isMobile ? <FilterChips filters={filters} /> : <FilterBar filters={filters} />) : undefined

  const body = () => {
    if (isPending) return <ListSkeleton />
    if (!isList) return <OrgChart members={members} onOpen={id => void profile.open(id)} />
    if (shown.length === 0) {
      return (
        <PageState kind="search" title="조건에 맞는 구성원이 없습니다" description="찾는 말이나 필터를 바꾸거나 지워 보세요."
          action={<Button variant="secondary" onClick={clear}>조건 지우기</Button>} />
      )
    }
    const count = (
      <p className="px-4 py-3 text-sm text-muted-foreground tabular-nums">
        {isNarrowed ? `${members.length}명 중 ${shown.length}명` : `${members.length}명`}
      </p>
    )
    const open = (id: string) => void profile.open(id)
    return <>{isMobile ? <MemberList members={shown} onOpen={open} /> : <MembersTable members={shown} onOpen={open} />}{count}</>
  }

  return (
    <Page
      crumbs={[{ label: "구성원", icon: UsersIcon }]}
      views={<PageViews label="구성원 뷰" views={VIEWS} value={view} onChange={setView} />}
      tools={isList ? <><SearchTool label="구성원 찾기" placeholder="이름 · 이메일 · 부서" value={query} onChange={setQuery} /><FilterMenu filters={filters} /></> : undefined}
      below={below}>
      {body()}
      {dialogMember && !isMobile && (
        <ProfileDialog memberId={dialogMember} onClose={() => void profile.close()}
          onOpenMember={id => void profile.open(id, { replace: true })} onExpand={id => void profile.page(id, true)} />
      )}
    </Page>
  )
}
