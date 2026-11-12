import { useNavigate, useSearch } from "@tanstack/react-router"
import { isDay, mondayOf, thisMonday } from "@/entities/weekly-report"
import { paths } from "@/shared/config"

/**
 * 목록이 보는 주(?week=월요일). 없으면 이번 주, 미래 주는 이번 주로 돌린다. 이번 주는 주소에서 뺀다.
 * 다른 주로 넘기는 것은 기록을 쌓지 않는다. 보고 · 쓰기는 각자 페이지가 있다(model/panel).
 */
export function useListWeek() {
  const search = useSearch({ strict: false }) as Record<string, unknown>
  const navigate = useNavigate()
  const current = thisMonday()
  const asked = isDay(search.week) ? mondayOf(search.week) : current
  return {
    week: asked > current ? current : asked,
    thisWeek: current,
    showWeek: (week: string) => void navigate({
      to: paths.weeklyReports, replace: true,
      search: (old: Record<string, unknown>) => ({ ...old, week: week === current ? undefined : week }),
    }),
  }
}

/** 주소의 주(쓰기 페이지의 $weekStart): 날짜면 그 주의 월요일, 아니거나 미래면 이번 주. */
export function weekFrom(value: unknown) {
  const current = thisMonday()
  const asked = isDay(value) ? mondayOf(value) : current
  return asked > current ? current : asked
}

/** 쓰기에서 돌아갈 보고의 주소(?returnTo). 주간보고 안의 보고 주소만 받는다. */
export const returnToOf = (search: Record<string, unknown>) =>
  typeof search.returnTo === "string" && /^\/weekly-reports\/[\w-]+$/.test(search.returnTo) && !search.returnTo.startsWith("/weekly-reports/write")
    ? search.returnTo : undefined

/** 보고 · 쓰기 대화상자의 주소: /weekly-reports/write(/월요일) 또는 /weekly-reports/{id}. */
export function panelTarget(pathname: string | undefined): { kind: "write"; week: string } | { kind: "report"; id: string } | undefined {
  if (!pathname) return undefined
  const write = /^\/weekly-reports\/write(?:\/([^/]+))?$/.exec(pathname)
  if (write) return { kind: "write", week: weekFrom(write[1]) }
  const report = /^\/weekly-reports\/([^/]+)$/.exec(pathname)
  return report ? { kind: "report", id: decodeURIComponent(report[1]) } : undefined
}
