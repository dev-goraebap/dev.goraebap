import { ReportStateBadge, isSubmitted, momentText, weekText, type WeeklyReport } from "@/entities/weekly-report"
import { Button } from "@/shared/ui/button"
import { CalendarIcon, CheckIcon, ClockIcon, UsersIcon } from "@/shared/ui/icon"
import { InfoPill } from "@/shared/ui/info-pill"
import { PageState } from "@/shared/ui/page-state"
import { DetailLayout, MarkdownBody } from "@/shared/ui/reading"

/** 보고의 한 단계(호호코워크 ReadingPart): 소제목과 Markdown, 비었으면 "없음". */
function ReportPart({ title, source }: { title: string; source: string }) {
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <h2 className="text-xl leading-[1.4] font-semibold">{title}</h2>
      {source.trim() ? <MarkdownBody source={source} /> : <p className="text-muted-foreground">없음</p>}
    </section>
  )
}

/**
 * 한 사람의 한 주 보고(호호코워크 WeeklyReportPage): 소속 줄에 주, 제목 "이름 주간보고", 속성(상태 · 주 · 부서 · 제출 · 확인),
 * 본문은 금주 주간보고 · 차주 주간계획 · 비고. 아직 내지 않은 보고는 빈 화면으로 알리고, 내 보고면 쓰기를 건넨다.
 */
export function ReportDetail({ report, onWrite }: { report: WeeklyReport; onWrite: () => void }) {
  const { author } = report
  if (!isSubmitted(report.state)) {
    return (
      <div className="flex flex-1 flex-col bg-background">
        <PageState kind="empty"
          title={report.isMine ? "이 주의 내 보고를 아직 제출하지 않았습니다" : `${author.name}님이 아직 보고를 제출하지 않았습니다`}
          description={`${weekText(report.weekStart)} · ${report.isMine ? "쓰고 제출하면 팀이 볼 수 있습니다." : "제출하면 여기에서 읽을 수 있습니다."}`}
          action={report.isMine ? <Button variant="create" onClick={onWrite}>{report.state === "draft" ? "이어 쓰기" : "내 주간보고 쓰기"}</Button> : undefined} />
      </div>
    )
  }
  const title = `${author.name} 주간보고`
  return (
    <DetailLayout label={`${title} ${weekText(report.weekStart)}`} title={title}
      head={<p className="text-sm text-muted-foreground tabular-nums">주간보고 · {weekText(report.weekStart)}</p>}
      sections={[{
        title: "속성",
        items: (
          <>
            <ReportStateBadge state={report.state} />
            <InfoPill label="주" icon={<CalendarIcon />}>{weekText(report.weekStart)}</InfoPill>
            <InfoPill label="부서" icon={<UsersIcon />}>{author.department}</InfoPill>
            {report.submittedAt && <InfoPill label="제출" icon={<ClockIcon />}>{momentText(report.submittedAt)} 제출</InfoPill>}
            <InfoPill label="확인" icon={<CheckIcon />}>
              {report.confirmedAt ? `${report.confirmedBy ?? "부서장"} · ${momentText(report.confirmedAt)} 확인` : "아직 확인 전"}
            </InfoPill>
          </>
        ),
      }]}>
      <ReportPart title="금주 주간보고" source={report.thisWeek} />
      <ReportPart title="차주 주간계획" source={report.nextWeek} />
      <ReportPart title="비고" source={report.note} />
    </DetailLayout>
  )
}
