import { useParams } from "@tanstack/react-router"
import { ReportSurface } from "./ReportSurface"

/**
 * 보고 하나의 자기 페이지(/weekly-reports/{id}): 링크 · 새로고침 · 크게 보기, 그리고 휴대폰은 늘 여기로 온다
 * (데스크톱에서 목록의 줄을 누르면 목록 위 대화상자다).
 */
export function WeeklyReportPage() {
  const { reportId = "" } = useParams({ strict: false }) as { reportId?: string }
  return <ReportSurface key={reportId} id={reportId} surface="page" />
}
