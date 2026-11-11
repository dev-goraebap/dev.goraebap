import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isSubmitted } from "../model/states"
import type { SaveWeeklyReport, WeeklyReport } from "../model/types"
import { shiftWeek } from "../model/weeks"
import { ME, mockWeeklyReports } from "./mock"

const key = ["weekly-reports"] as const

/** 서버가 없으므로 약 300ms 뒤에 목 데이터를 돌려준다. 이후 변경은 쿼리 캐시에만 남는다. */
const listOptions = {
  queryKey: key,
  queryFn: () => new Promise<WeeklyReport[]>(resolve => setTimeout(() => resolve(mockWeeklyReports()), 300)),
  staleTime: Infinity,
}

/** 나 먼저, 그다음 제출한 사람(먼저 낸 순), 마지막에 아직 안 낸 사람. */
const order = (report: WeeklyReport) => (report.isMine ? 0 : isSubmitted(report.state) ? 1 : 2)
const byOrder = (a: WeeklyReport, b: WeeklyReport) => order(a) - order(b) || (a.submittedAt ?? "").localeCompare(b.submittedAt ?? "")

/** 한 주의 팀 보고(사람마다 하나, 안 쓴 사람은 작성 전). 그 주에 보고가 하나도 없으면 빈 목록이다. */
export function useWeekReports(weekStart: string) {
  return useQuery({ ...listOptions, select: (reports: WeeklyReport[]) => reports.filter(report => report.weekStart === weekStart).sort(byOrder) })
}

/** 한 사람의 한 주 보고. 읽는 동안 undefined, 그 주에 그 사람이 없으면 null. */
export function useWeeklyReport(weekStart: string, memberId: string) {
  return useQuery({
    ...listOptions,
    select: (reports: WeeklyReport[]) => reports.find(report => report.weekStart === weekStart && report.author.id === memberId) ?? null,
  })
}

/** 한 주의 내 보고(없으면 작성 전 빈 보고)와, 새로 쓸 때 금주 실적의 처음 값이 될 지난주의 차주 계획. */
export type MyWeeklyReport = { report: WeeklyReport; prefill?: string }

export function useMyWeeklyReport(weekStart: string) {
  return useQuery({
    ...listOptions,
    select: (reports: WeeklyReport[]): MyWeeklyReport => {
      const mine = (week: string) => reports.find(report => report.isMine && report.weekStart === week)
      const report = mine(weekStart) ?? {
        id: `${weekStart}:${ME.id}`, weekStart, author: ME, isMine: true, state: "none", thisWeek: "", nextWeek: "", note: "",
      }
      const plan = mine(shiftWeek(weekStart, -1))?.nextWeek
      return { report, prefill: report.state === "none" && plan ? plan : undefined }
    },
  })
}

/** 내 보고를 임시 저장하거나 제출해 캐시에 넣는다. 제출한 보고는 확인을 다시 받는다. */
export function useSaveWeeklyReport() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ weekStart, submit, ...parts }: SaveWeeklyReport): Promise<WeeklyReport> => {
      const current = client.getQueryData<WeeklyReport[]>(key)?.find(report => report.isMine && report.weekStart === weekStart)
      const wasSubmitted = current ? isSubmitted(current.state) : false
      return {
        id: `${weekStart}:${ME.id}`, weekStart, author: ME, isMine: true, ...parts,
        state: submit || wasSubmitted ? "submitted" : "draft",
        submittedAt: submit || wasSubmitted ? new Date().toISOString() : undefined,
      }
    },
    onSuccess: saved => client.setQueryData<WeeklyReport[]>(key, old => {
      const reports = old ?? []
      return reports.some(report => report.id === saved.id) ? reports.map(report => (report.id === saved.id ? saved : report)) : [...reports, saved]
    }),
  })
}
