import { useLocation, useNavigate, useParams } from "@tanstack/react-router"
import { thisMonday, weeklyReportWriteHref } from "@/entities/weekly-report"
import { paths } from "@/shared/config"
import { returnToOf, weekFrom } from "../model/week"
import { WriteSurface } from "./WriteSurface"

/**
 * 한 주의 내 보고를 쓰거나 고치는 자기 페이지(/weekly-reports/write/{월요일}, 주가 없으면 이번 주): 링크 · 새로고침 · 크게 보기,
 * 그리고 휴대폰은 늘 여기로 온다(데스크톱에서 목록 · 보고의 버튼으로 열면 그 위 대화상자다).
 * 취소는 온 곳(?returnTo의 보고, 없으면 목록)으로, 제출하면 그 보고가 이 자리를 대신한다. 주를 바꾸면 그 주의 주소로 바꾼다.
 */
export function WeeklyReportWritePage() {
  const navigate = useNavigate()
  const { weekStart } = useParams({ strict: false }) as { weekStart?: string }
  const returnTo = useLocation({ select: location => returnToOf(location.search as Record<string, unknown>) })
  const week = weekFrom(weekStart)
  return (
    <WriteSurface key={week} surface="page" week={week} thisWeek={thisMonday()}
      onWeek={next => void navigate({ href: weeklyReportWriteHref(next, returnTo), replace: true })}
      onClose={() => void navigate({ href: returnTo ?? paths.weeklyReports, replace: true })}
      onDone={href => void navigate({ href, replace: true })} />
  )
}
