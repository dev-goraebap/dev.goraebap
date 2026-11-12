import { useState } from "react"
import {
  ReportStateBadge, isSubmitted, momentText, summaryOf, weeklyReportHref, weeklyReportWriteHref, type WeeklyReport,
} from "@/entities/weekly-report"
import { toggleValue } from "@/shared/lib/toggle"
import { cn } from "@/shared/lib/utils"
import { ListGroupHeader } from "@/shared/ui/list-group-header"
import { PersonAvatar } from "@/shared/ui/person-avatar"
import { DetailLink } from "@/shared/ui/detail-surface"

/** 줄은 자기 바탕을 칠해 페이지의 점 무늬를 가리고, 가리키면 옅게 덮는다(업무 줄과 같다). */
const ROW = "relative border-b bg-background px-4 text-sm hover:bg-row-hover"

/** 줄이 여는 곳: 보고의 페이지. 아직 내지 않은 내 보고는 그 주의 쓰기다(호호코워크 WeeklyReportsPage의 href). */
const hrefOf = (report: WeeklyReport) =>
  report.isMine && !isSubmitted(report.state) ? weeklyReportWriteHref(report.weekStart) : weeklyReportHref(report.id)

/** 이름을 그 보고로 잇는 줄 링크. 데스크톱은 목록 위 대화상자, 휴대폰은 페이지, 보조 키는 새 탭(DetailLink). */
function ReportLink({ report, className }: { report: WeeklyReport; className?: string }) {
  return <DetailLink href={hrefOf(report)} className={className}>{report.author.name}</DetailLink>
}

const Mine = () => <span className="shrink-0 text-xs text-muted-foreground">나</span>

/** 요약: 금주 실적의 첫 줄. 내지 않은 보고는 그렇다고 흐리게. */
const summaryText = (report: WeeklyReport) =>
  isSubmitted(report.state) ? summaryOf(report) : report.state === "draft" ? "작성 중입니다. 제출하면 팀에 보입니다." : "아직 제출하지 않았습니다."

/**
 * 보고 한 줄. 데스크톱(호호코워크 주간보고 표의 칸을 한 줄로): 아바타 · 이름 · 부서 · 요약 · 상태 · 제출 시각.
 * 휴대폰: 32px 아바타, 첫 줄에 이름과 상태, 둘째 줄에 요약, 셋째 줄에 부서 · 제출 시각.
 */
function ReportRow({ report, isCompact }: { report: WeeklyReport; isCompact: boolean }) {
  const submitted = report.submittedAt ? `${momentText(report.submittedAt)} 제출` : ""
  if (isCompact) {
    return (
      <li className={cn(ROW, "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 py-3")}>
        <PersonAvatar id={report.author.id} name={report.author.name} className="row-span-3 size-8 self-start" />
        <span className="flex min-w-0 items-center gap-1.5 font-medium">
          <ReportLink report={report} className="truncate" />
          {report.isMine && <Mine />}
        </span>
        <ReportStateBadge state={report.state} />
        <p className={cn("col-span-2 truncate", !isSubmitted(report.state) && "text-muted-foreground")}>{summaryText(report)}</p>
        <p className="col-span-2 truncate text-xs text-muted-foreground tabular-nums">{[report.author.department, submitted].filter(Boolean).join(" · ")}</p>
      </li>
    )
  }
  return (
    <li className={cn(ROW, "flex items-center gap-3 py-3 compact:py-2")}>
      <span className="flex w-36 shrink-0 items-center gap-2 font-medium">
        <PersonAvatar id={report.author.id} name={report.author.name} />
        <ReportLink report={report} className="truncate" />
        {report.isMine && <Mine />}
      </span>
      <span className="w-18 shrink-0 truncate text-muted-foreground">{report.author.department}</span>
      <span className={cn("min-w-0 flex-1 truncate", !isSubmitted(report.state) && "text-muted-foreground")}>{summaryText(report)}</span>
      <span className="flex w-16 shrink-0 justify-end"><ReportStateBadge state={report.state} /></span>
      <span className="w-28 shrink-0 text-right text-muted-foreground tabular-nums">{submitted}</span>
    </li>
  )
}

type Group = { id: string; label: string; reports: WeeklyReport[] }

/** 한 주의 팀 보고를 제출 · 미제출로 묶는다. 묶음은 접을 수 있고, 빈 묶음은 그리지 않는다. */
export function ReportList({ reports, isCompact }: { reports: WeeklyReport[]; isCompact: boolean }) {
  const [closed, setClosed] = useState<string[]>([])
  const groups: Group[] = [
    { id: "in", label: "제출", reports: reports.filter(report => isSubmitted(report.state)) },
    { id: "out", label: "미제출", reports: reports.filter(report => !isSubmitted(report.state)) },
  ]
  return (
    <div className="flex flex-col">
      {groups.filter(group => group.reports.length > 0).map(group => {
        const isOpen = !closed.includes(group.id)
        return (
          <section key={group.id} aria-label={group.label}>
            <ListGroupHeader label={group.label} count={group.reports.length} isOpen={isOpen}
              onToggle={() => setClosed(current => toggleValue(current, group.id))} />
            {isOpen && (
              <ul className="flex flex-col">
                {group.reports.map(report => <ReportRow key={report.id} report={report} isCompact={isCompact} />)}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
