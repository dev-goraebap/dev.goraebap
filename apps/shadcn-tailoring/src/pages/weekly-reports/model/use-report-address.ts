import { useNavigate, useSearch } from "@tanstack/react-router"
import { isDay, mondayOf, thisMonday } from "@/entities/weekly-report"
import { paths } from "@/shared/config"

/**
 * 주간보고 화면의 자리는 모두 /weekly-reports의 검색 값에 둔다(라우터는 고치지 않는다).
 * - week: 보는 주의 월요일. 없으면 이번 주. 미래 주는 이번 주로 돌린다.
 * - member: 그 주에 연 사람의 보고(상세).
 * - write: 내 보고 쓰기(데스크톱은 목록 위 대화상자, 휴대폰은 자기 화면).
 */
export type ReportAddress = { week: string; member?: string; isWriting: boolean }

/** 주소에서 읽은 자리와 그 자리를 바꾸는 길. 여는 것은 기록에 남겨 뒤로 가기가 닫기가 되고, 닫기와 주 넘기기는 기록을 바꿔 쓴다. */
export function useReportAddress() {
  const search = useSearch({ strict: false }) as Record<string, unknown>
  const navigate = useNavigate()
  const current = thisMonday()
  const asked = isDay(search.week) ? mondayOf(search.week) : current
  const address: ReportAddress = {
    week: asked > current ? current : asked,
    member: typeof search.member === "string" ? search.member : undefined,
    isWriting: search.write === 1 || search.write === "1",
  }
  /** 이번 주는 주소에서 뺀다. */
  const go = (next: { week: string; member?: string; isWriting?: boolean }, replace = false) => void navigate({
    to: paths.weeklyReports, replace,
    search: { week: next.week === current ? undefined : next.week, member: next.member, write: next.isWriting ? 1 : undefined },
  })
  return {
    ...address,
    thisWeek: current,
    /** 다른 주로 옮긴다(목록의 넘기기). 기록을 쌓지 않는다. */
    showWeek: (week: string) => go({ week }, true),
    openReport: (member: string) => go({ week: address.week, member }),
    openWrite: (week = address.week) => go({ week, isWriting: true }),
    /** 쓰는 중 다른 주를 고른다. */
    writeWeek: (week: string) => go({ week, isWriting: true }, true),
    /** 상세 · 쓰기를 닫고 그 주의 목록으로. */
    backToList: (week = address.week) => go({ week }, true),
  }
}

/** 화면 조각에 넘기는 주소와 길. */
export type ReportPlace = ReturnType<typeof useReportAddress>
