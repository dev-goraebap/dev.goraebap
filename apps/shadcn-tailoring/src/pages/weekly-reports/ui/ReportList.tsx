import { Link } from "@tanstack/react-router"
import { useState } from "react"
import { ReportStateBadge, isSubmitted, momentText, summaryOf, type WeeklyReport } from "@/entities/weekly-report"
import { paths } from "@/shared/config"
import { toggleValue } from "@/shared/lib/toggle"
import { cn } from "@/shared/lib/utils"
import { ListGroupHeader } from "@/shared/ui/list-group-header"
import { PersonAvatar } from "@/shared/ui/person-avatar"

/** 줄은 자기 바탕을 칠해 페이지의 점 무늬를 가리고, 가리키면 옅게 덮는다(업무 줄과 같다). */
const ROW = "relative border-b bg-background px-4 text-sm hover:bg-row-hover"

/**
 * 이름을 그 보고의 상세로 잇는 링크. ::after가 줄 전체를 덮어 어디를 눌러도 열리고, 키보드 초점은 줄 전체에 테를 두른다.
 * 주소는 /weekly-reports?week=…&member=…(라우터를 고치지 않으려 검색 값에 둔다).
 */
function ReportLink({ report, className }: { report: WeeklyReport; className?: string }) {
  return (
    <Link to={paths.weeklyReports} search={{ week: report.weekStart, member: report.author.id }}
      className={cn("outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring", className)}>
      {report.author.name}
    </Link>
  )
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
