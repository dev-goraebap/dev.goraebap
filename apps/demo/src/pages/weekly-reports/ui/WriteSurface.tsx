import { ME, useMyWeeklyReport, weeklyReportHref } from "@/entities/weekly-report"
import { paths } from "@/shared/config"
import { ComposeSurface, PlaceChip } from "@/shared/ui/compose"
import { FileTextIcon, PenSquareIcon } from "@/shared/ui/icon"
import type { Crumb } from "@/shared/ui/page"
import { Skeleton } from "@/shared/ui/skeleton"
import { WriteForm, type WritePlace } from "./WriteForm"

type WriteSurfaceProps = {
  /** dialog: 목록 · 보고 위 대화상자(데스크톱). page: 자기 페이지(링크 · 새로고침 · 크게 보기, 휴대폰은 늘). */
  surface: "dialog" | "page"
  week: string
  thisWeek: string
  onWeek: (week: string) => void
  onClose: () => void
  /** 크게 보기: 같은 양식을 자기 페이지로. 대화상자에만 있다. */
  onExpand?: () => void
  /** 제출한 뒤: 그 보고의 주소로. */
  onDone: (href: string) => void
}

const CRUMBS: Crumb[] = [{ label: "주간보고", href: paths.weeklyReports }, { label: "주간보고 작성", icon: PenSquareIcon }]

/**
 * 주간보고 작성이 놓이는 곳(호호코워크 WeeklyReportCompose의 ComposeSurface): 다른 만들기 양식과 같은 대화상자 · 페이지 ·
 * 휴대폰 화면에 부서 칩과 "주간보고 작성". 내 보고를 읽는 동안에도 같은 자리에 뼈대와 누를 수 없는 다음을 둔다.
 */
export function WriteSurface({ surface, week, thisWeek, onWeek, onClose, onExpand, onDone }: WriteSurfaceProps) {
  const { data } = useMyWeeklyReport(week)
  const place: WritePlace = { surface, crumbs: CRUMBS, chip: <PlaceChip icon={<FileTextIcon />} label={ME.department} />, onClose }
  if (!data) {
    return (
      <ComposeSurface {...place} submit={{ label: "다음", onSubmit: () => {}, isDisabled: true }}>
        <div aria-busy="true" aria-label="주간보고를 읽는 중" className="flex flex-col gap-4">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-40 w-full" />
        </div>
      </ComposeSurface>
    )
  }
  return (
    <WriteForm key={data.report.weekStart} {...place} report={data.report} prefill={data.prefill} thisWeek={thisWeek} onWeek={onWeek} onExpand={onExpand}
      onSaved={saved => onDone(weeklyReportHref(saved.id))} />
  )
}
