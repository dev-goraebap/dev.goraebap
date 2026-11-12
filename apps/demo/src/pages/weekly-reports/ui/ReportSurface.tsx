import { Link } from "@tanstack/react-router"
import { isSubmitted, useWeeklyReportById, weeklyReportHref, weeklyReportWriteHref, weekShortText, weekText, type WeeklyReport } from "@/entities/weekly-report"
import { paths } from "@/shared/config"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { cn } from "cn"
import { ActionMenu } from "@/shared/ui/action-menu"
import { Button } from "@/shared/ui/button"
import { DetailSurface } from "@/shared/ui/detail-surface"
import { FileTextIcon, LinkIcon, PenSquareIcon } from "@/shared/ui/icon"
import { PageState } from "@/shared/ui/page-state"
import { Skeleton } from "@/shared/ui/skeleton"
import { toast } from "@/shared/ui/toast"
import { useOpenPanel } from "@/shared/lib/panel"
import { ReportDetail } from "./ReportDetail"

const PLAIN = "flex flex-1 flex-col bg-background"

const copyLink = (id: string) => navigator.clipboard.writeText(`${location.origin}${weeklyReportHref(id)}`).then(
  () => toast.add({ type: "success", title: "링크를 복사했습니다" }),
  () => toast.add({ type: "error", title: "복사하지 못했습니다" }),
)

/** 머리의 페이지 메뉴(…): 링크 복사, 내 보고를 냈으면 고치기. */
function ReportMenu({ report, onWrite }: { report: WeeklyReport; onWrite: () => void }) {
  return (
    <ActionMenu label="주간보고 메뉴" title={`${report.author.name} 주간보고`} actions={[
      { label: "링크 복사", icon: LinkIcon, onSelect: () => void copyLink(report.id) },
      ...(report.isMine && isSubmitted(report.state) ? [{ label: "고치기", icon: PenSquareIcon, onSelect: onWrite }] : []),
    ]} />
  )
}

function Body({ report, onWrite }: { report: WeeklyReport | null | undefined; onWrite: () => void }) {
  if (report === undefined) {
    return (
      <div aria-busy="true" aria-label="보고를 읽는 중" className={cn(PLAIN, "mx-auto w-full max-w-180 gap-4 px-4 pt-8")}>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-3/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    )
  }
  if (report === null) {
    return (
      <div className={PLAIN}>
        <PageState kind="not-found" title="주간보고를 찾을 수 없습니다" description="삭제했거나 주소가 바뀐 보고입니다."
          action={<Button variant="secondary" nativeButton={false} render={<Link to={paths.weeklyReports} />}>주간보고로</Button>} />
      </div>
    )
  }
  return <ReportDetail report={report} onWrite={onWrite} />
}

/**
 * 한 사람의 한 주 보고(호호코워크 WeeklyReportPage + DetailSurface). page: 자기 페이지(/weekly-reports/{id}), 경로 주간보고 › 이름 · 주와
 * 머리 줄 끝의 메뉴. dialog: 데스크톱에서 목록이 연 대화상자(최대 60rem), 머리에 메뉴 · 크게 보기 · 닫기.
 * 고치기는 대화상자 안이면 그 자리를 쓰기로 바꾸고, 페이지면 쓰기 페이지로 간다. 끝나면 이 보고로 돌아온다(returnTo).
 */
export function ReportSurface({ id, surface, onClose, onExpand }: {
  id: string
  surface: "dialog" | "page"
  onClose?: () => void
  onExpand?: () => void
}) {
  const isMobile = useIsMobile()
  const open = useOpenPanel()
  const { data: report } = useWeeklyReportById(id)
  const write = () => report && open(weeklyReportWriteHref(report.weekStart, weeklyReportHref(report.id)), { inherit: true })
  const name = report ? `${report.author.name} · ${(isMobile ? weekShortText : weekText)(report.weekStart)}` : "보고"
  return (
    <DetailSurface surface={surface} title="주간보고" crumbs={[{ label: "주간보고", href: paths.weeklyReports }, { label: name, icon: FileTextIcon }]}
      actions={report && <ReportMenu report={report} onWrite={write} />} onClose={onClose} onExpand={onExpand}>
      <Body report={report} onWrite={write} />
    </DetailSurface>
  )
}
