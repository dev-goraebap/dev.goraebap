import {
  ME, REPORT_STATES, TEAM, reportIdOf, useWeekReports, weeklyReportHref, weeklyReportWriteHref, weekText,
} from "@/entities/weekly-report"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { Button } from "@/shared/ui/button"
import { FilterBar, FilterChips, FilterMenu, useFilters, type FilterDef } from "@/shared/ui/filter"
import { FileTextIcon, ListChecksIcon, UsersIcon } from "@/shared/ui/icon"
import { Page } from "@/shared/ui/page"
import { PageState } from "@/shared/ui/page-state"
import { Skeleton } from "@/shared/ui/skeleton"
import { useOpenPanel, usePanel } from "../model/panel"
import { panelTarget, returnToOf, useListWeek } from "../model/week"
import { MyReportBar } from "./MyReportBar"
import { ReportList } from "./ReportList"
import { ReportSurface } from "./ReportSurface"
import { WeekNav } from "./WeekNav"
import { WriteSurface } from "./WriteSurface"

type FilterKey = "department" | "state"
const FILTERS: FilterDef<FilterKey>[] = [
  { key: "department", label: "부서", icon: UsersIcon, options: [...new Set(TEAM.map(member => member.department))].map(name => ({ value: name, label: name })) },
  { key: "state", label: "상태", icon: ListChecksIcon, options: REPORT_STATES.map(state => ({ value: state.value, label: state.label })) },
]


/** 읽는 동안의 자리: 내 보고 줄과 목록 줄 몇 개. */
function ListSkeleton() {
  return (
    <div aria-busy="true" aria-label="주간보고를 읽는 중" className="flex flex-col bg-background">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex items-center gap-3 border-b px-4 py-3.5">
          <Skeleton className="size-5 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  )
}

/**
 * 목록 위에 열린 보고 · 쓰기(호호코워크 PanelHost의 주간보고 몫). 쓰기에서 주를 바꾸면 그 자리를 바꾸고, 제출하면
 * 고치기로 온 보고(returnTo)면 닫아 그 보고로 돌아가고, 아니면 낸 보고가 그 자리를 대신한다.
 */
function ReportPanel({ thisWeek }: { thisWeek: string }) {
  const panel = usePanel()
  const open = useOpenPanel()
  const target = panelTarget(panel.pathname)
  if (!panel.href || !target) return null
  if (target.kind === "report") return <ReportSurface key={panel.href} id={target.id} surface="dialog" onClose={panel.close} onExpand={panel.expand} />
  const returnTo = returnToOf(panel.search)
  return (
    <WriteSurface key={panel.href} surface="dialog" week={target.week} thisWeek={thisWeek}
      onWeek={week => open(weeklyReportWriteHref(week, returnTo), { replace: true })}
      onClose={panel.close} onExpand={panel.expand}
      onDone={href => (href === returnTo ? panel.close() : open(href, { inherit: true, replace: true }))} />
  )
}

/**
 * 주간보고(호호코워크 WeeklyReportsPage): 한 주의 팀 보고. 툴바에 주 넘기기와 필터, 위에 내 보고 줄, 아래 제출 · 미제출 묶음.
 * 보고와 쓰기는 각자 페이지(/weekly-reports/{id}, /weekly-reports/write/{월요일})가 있고, 데스크톱에서 여기서 열면
 * 목록 위 대화상자(주소창에는 그 페이지 주소), 휴대폰은 그 페이지로 간다.
 */
export function WeeklyReportsPage() {
  const isMobile = useIsMobile()
  const { week, thisWeek, showWeek } = useListWeek()
  const open = useOpenPanel()
  const { data: reports } = useWeekReports(week)
  const filters = useFilters(FILTERS)
  const { department = [], state = [] } = filters.state
  const shown = (reports ?? []).filter(report =>
    (department.length === 0 || department.includes(report.author.department)) && (state.length === 0 || state.includes(report.state)))
  const write = () => open(weeklyReportWriteHref(week))

  const body = () => {
    if (!reports) return <ListSkeleton />
    if (reports.length === 0) {
      return (
        <PageState kind="empty" title="이 주의 주간보고가 없습니다" description={`${weekText(week)}에는 팀이 쓴 보고가 없습니다.`}
          action={<Button variant="secondary" onClick={() => showWeek(thisWeek)}>이번 주로</Button>} />
      )
    }
    return (
      <>
        <MyReportBar week={week} onWrite={write} onOpen={() => open(weeklyReportHref(reportIdOf(week, ME.id)))} />
        {shown.length === 0
          ? <PageState kind="search" title="조건에 맞는 보고가 없습니다" description="필터를 바꾸거나 지워 보세요."
            action={<Button variant="secondary" onClick={filters.clear}>필터 지우기</Button>} />
          : <ReportList reports={shown} isCompact={isMobile} />}
      </>
    )
  }

  return (
    <Page crumbs={[{ label: "주간보고", icon: FileTextIcon }]}
      create={{ label: "내 주간보고 쓰기", onClick: write }}
      views={<WeekNav week={week} thisWeek={thisWeek} onChange={showWeek} />}
      tools={<FilterMenu filters={filters} />}
      below={isMobile ? <FilterChips filters={filters} /> : <FilterBar filters={filters} />}>
      {body()}
      <ReportPanel thisWeek={thisWeek} />
    </Page>
  )
}
