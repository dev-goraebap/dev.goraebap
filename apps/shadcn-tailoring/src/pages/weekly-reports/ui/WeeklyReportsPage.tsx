import { Link } from "@tanstack/react-router"
import { ME, REPORT_STATES, TEAM, isSubmitted, useWeekReports, useWeeklyReport, weekShortText, weekText } from "@/entities/weekly-report"
import { paths } from "@/shared/config"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { cn } from "@/shared/lib/utils"
import { ActionMenu } from "@/shared/ui/action-menu"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog"
import { FilterBar, FilterChips, FilterMenu, useFilters, type FilterDef } from "@/shared/ui/filter"
import { FileTextIcon, LinkIcon, ListChecksIcon, PenSquareIcon, UsersIcon } from "@/shared/ui/icon"
import { Page, type Crumb } from "@/shared/ui/page"
import { PageState } from "@/shared/ui/page-state"
import { Skeleton } from "@/shared/ui/skeleton"
import { toast } from "@/shared/ui/toast"
import { useReportAddress, type ReportPlace } from "../model/use-report-address"
import { MyReportBar } from "./MyReportBar"
import { ReportDetail } from "./ReportDetail"
import { ReportList } from "./ReportList"
import { WeekNav } from "./WeekNav"
import { WriteForm } from "./WriteForm"

type FilterKey = "department" | "state"
const FILTERS: FilterDef<FilterKey>[] = [
  { key: "department", label: "부서", icon: UsersIcon, options: [...new Set(TEAM.map(member => member.department))].map(name => ({ value: name, label: name })) },
  { key: "state", label: "상태", icon: ListChecksIcon, options: REPORT_STATES.map(state => ({ value: state.value, label: state.label })) },
]

const LIST_CRUMB: Crumb = { label: "주간보고", href: paths.weeklyReports }

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

/** 한 주의 팀 보고 목록(호호코워크 WeeklyReportsPage): 툴바에 주 넘기기와 필터, 위에 내 보고 줄, 아래 제출 · 미제출 묶음. */
function ReportListPage({ address }: { address: ReportPlace }) {
  const isMobile = useIsMobile()
  const { data: reports } = useWeekReports(address.week)
  const filters = useFilters(FILTERS)
  const { department = [], state = [] } = filters.state
  const shown = (reports ?? []).filter(report =>
    (department.length === 0 || department.includes(report.author.department)) && (state.length === 0 || state.includes(report.state)))
  const write = () => address.openWrite()

  const body = () => {
    if (!reports) return <ListSkeleton />
    if (reports.length === 0) {
      return (
        <PageState kind="empty" title="이 주의 주간보고가 없습니다" description={`${weekText(address.week)}에는 팀이 쓴 보고가 없습니다.`}
          action={<Button variant="secondary" onClick={() => address.showWeek(address.thisWeek)}>이번 주로</Button>} />
      )
    }
    return (
      <>
        <MyReportBar week={address.week} onWrite={write} onOpen={() => address.openReport(ME.id)} />
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
      views={<WeekNav week={address.week} thisWeek={address.thisWeek} onChange={address.showWeek} />}
      tools={<FilterMenu filters={filters} />}
      below={isMobile ? <FilterChips filters={filters} /> : <FilterBar filters={filters} />}>
      {body()}
      {!isMobile && (
        <Dialog open={address.isWriting} onOpenChange={isOpen => { if (!isOpen) address.backToList() }}>
          <DialogContent className="top-[12%] flex max-h-[80dvh] translate-y-0 flex-col gap-0 p-0 sm:max-w-180">
            <DialogTitle className="sr-only">내 주간보고 쓰기</DialogTitle>
            <WriteForm week={address.week} thisWeek={address.thisWeek} isPage={false} onWeek={address.writeWeek}
              onSaved={saved => address.backToList(saved.weekStart)} />
          </DialogContent>
        </Dialog>
      )}
    </Page>
  )
}

/**
 * 휴대폰의 쓰기는 하단 탭을 숨긴 자기 화면이다(호호코워크: 휴대폰은 항상 페이지). 앱 바의 ← 가 목록으로 간다.
 * shared/ui/compose의 ComposeSurface는 바닥 줄에 만들기 하나만 두므로, 단계(이전 · 임시 저장 · 다음)가 있는 이 양식은 WriteForm이 바닥 줄을 그린다.
 */
function WritePage({ address }: { address: ReportPlace }) {
  return (
    <Page crumbs={[LIST_CRUMB, { label: "내 주간보고 쓰기", icon: PenSquareIcon }]} isFullScreen>
      <WriteForm week={address.week} thisWeek={address.thisWeek} isPage onWeek={address.writeWeek}
        onSaved={saved => address.backToList(saved.weekStart)} />
    </Page>
  )
}

/**
 * 한 사람의 보고(호호코워크 /weekly-reports/{id}의 상세). 경로 주간보고 › 이름, 머리 줄 끝에 페이지 메뉴(링크 복사, 내 보고면 고치기).
 * 데스크톱은 목록 대신 상세가 서고, 휴대폰은 같은 화면이 앱 바와 함께 전체 화면이 된다.
 */
function ReportPage({ address, member }: { address: ReportPlace; member: string }) {
  const isMobile = useIsMobile()
  const { data: report } = useWeeklyReport(address.week, member)
  const write = () => address.openWrite(address.week)
  const copyLink = () => void navigator.clipboard.writeText(window.location.href).then(() => toast.add({ type: "success", title: "링크를 복사했습니다" }))
  const menu = report && (
    <ActionMenu label="주간보고 메뉴" title={`${report.author.name} 주간보고`} actions={[
      { label: "링크 복사", icon: LinkIcon, onSelect: copyLink },
      ...(report.isMine && isSubmitted(report.state) ? [{ label: "고치기", icon: PenSquareIcon, onSelect: write }] : []),
    ]} />
  )
  const plain = "flex flex-1 flex-col bg-background"
  return (
    <Page crumbs={[LIST_CRUMB, { label: report ? `${report.author.name} · ${(isMobile ? weekShortText : weekText)(report.weekStart)}` : "보고", icon: FileTextIcon }]} actions={menu} isFullScreen>
      {report === undefined ? (
        <div aria-busy="true" aria-label="보고를 읽는 중" className={cn(plain, "mx-auto w-full max-w-180 gap-4 px-4 pt-8")}>
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-3/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      ) : report === null ? (
        <div className={plain}>
          <PageState kind="not-found" title="보고를 찾을 수 없습니다" description="이 주에 그 사람의 보고가 없거나 주소가 바뀌었습니다."
            action={<Button variant="outline" nativeButton={false} render={<Link to={paths.weeklyReports} />}>주간보고로</Button>} />
        </div>
      ) : (
        <ReportDetail report={report} onWrite={write} />
      )}
    </Page>
  )
}

/**
 * 주간보고. 화면의 자리는 /weekly-reports의 검색 값이다(use-report-address): 목록(week), 한 사람의 보고(member),
 * 내 보고 쓰기(write: 데스크톱은 목록 위 대화상자, 휴대폰은 자기 화면).
 */
export function WeeklyReportsPage() {
  const address = useReportAddress()
  const isMobile = useIsMobile()
  if (address.member) return <ReportPage address={address} member={address.member} />
  if (address.isWriting && isMobile) return <WritePage address={address} />
  return <ReportListPage address={address} />
}
