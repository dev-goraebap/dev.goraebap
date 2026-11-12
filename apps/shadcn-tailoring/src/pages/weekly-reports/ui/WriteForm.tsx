import { useEffect, useState, type FormEvent, type KeyboardEvent, type RefObject } from "react"
import {
  ME, WEEKS, dueText, isSubmitted, shiftWeek, useMyWeeklyReport, useSaveWeeklyReport, weekName, weekText,
  type ReportParts, type WeeklyReport,
} from "@/entities/weekly-report"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { CalendarIcon } from "@/shared/ui/icon"
import { OptionPill } from "@/shared/ui/property-pill"
import { Skeleton } from "@/shared/ui/skeleton"
import { toast } from "@/shared/ui/toast"
import { carryDraft, useCarriedDraft } from "../model/panel"

/** 회사 양식의 세 단계(호호코워크 WeeklyReportCompose). 비고만 비워도 된다. */
const STEPS: readonly { part: keyof ReportParts; label: string; placeholder: string; required?: string }[] = [
  { part: "thisWeek", label: "금주 주간보고", placeholder: "이번 주에 한 일을 적어 주세요", required: "이번 주에 한 일을 적어 주세요." },
  { part: "nextWeek", label: "차주 주간계획", placeholder: "다음 주에 할 일을 적어 주세요", required: "다음 주에 할 일을 적어 주세요." },
  { part: "note", label: "비고", placeholder: "건의하거나 함께 검토할 일이 있으면 적어 주세요" },
]

export const WRITE_FORM_ID = "weekly-report-write"

/** 단계 표시: 번호와 이름, 누르면 그 단계로. 지금 단계는 진하게. */
function Steps({ step, onStep }: { step: number; onStep: (step: number) => void }) {
  return (
    <ol aria-label="주간보고 작성 단계" className="flex flex-wrap items-center gap-1">
      {STEPS.map((each, index) => {
        const isCurrent = index === step
        return (
          <li key={each.part}>
            <Button type="button" variant={isCurrent ? "view-active" : "view"} aria-current={isCurrent ? "step" : undefined}
              onClick={() => onStep(index)} className="px-3 max-md:h-9">
              <span className="tabular-nums">{index + 1}</span>
              {each.label}
            </Button>
          </li>
        )
      })}
    </ol>
  )
}

/** 고를 수 있는 주: 이번 주부터 보고를 모아 둔 주까지. */
const weekOptions = (thisWeek: string) => Array.from({ length: WEEKS }, (_, back) => shiftWeek(thisWeek, -back)).map(week => {
  const name = weekName(week)
  return { value: week, label: name === weekText(week) ? name : `${name} · ${weekText(week)}` }
})

type FormProps = {
  report: WeeklyReport
  /** 새로 쓸 때 금주 실적의 처음 값(지난주의 차주 계획). */
  prefill?: string
  thisWeek: string
  onWeek: (week: string) => void
  onSaved: (report: WeeklyReport) => void
  /** 자기 페이지면 true(바닥 줄을 화면 아래에 붙인다), 데스크톱 대화상자면 false. */
  isPage: boolean
  /** 크게 보기 직전에 부르는 맡기기. 양식이 채워 두고, 대화상자의 크게 보기가 부른 뒤 페이지로 간다. */
  keepRef?: RefObject<(() => void) | undefined>
  /** 자기 페이지의 취소(대화상자는 머리의 닫기가 맡는다). */
  onCancel?: () => void
}

type Carried = { parts: ReportParts; step: number }
const carryKey = (weekStart: string) => `weekly:${weekStart}`

/**
 * 한 주의 내 보고 양식(호호코워크 PaperForm): 주가 이름이 되는 제목, 마감과 작성자, 단계 표시, 지금 단계의 Markdown 칸, 주 알약.
 * 바닥 줄은 이전 · 임시 저장(제출 전만) · 다음 또는 제출(제출한 보고는 저장). Ctrl/⌘+Enter가 바닥 줄의 주 동작이다.
 */
function ReportForm({ report, prefill, thisWeek, onWeek, onSaved, isPage, keepRef, onCancel }: FormProps) {
  const save = useSaveWeeklyReport()
  const carried = useCarriedDraft<Carried>(carryKey(report.weekStart))
  const [parts, setParts] = useState<ReportParts>(() => carried?.parts ?? { thisWeek: report.thisWeek || prefill || "", nextWeek: report.nextWeek, note: report.note })
  const [step, setStep] = useState(() => carried?.step ?? 0)
  useEffect(() => {
    if (!keepRef) return
    keepRef.current = () => carryDraft(carryKey(report.weekStart), { parts, step } satisfies Carried)
  }, [keepRef, report.weekStart, parts, step])
  const [problem, setProblem] = useState<string>()
  const wasSubmitted = isSubmitted(report.state)
  const isLast = step === STEPS.length - 1
  const current = STEPS[step]

  const move = (next: number) => { setStep(next); setProblem(undefined) }
  const store = (submit: boolean) => {
    if (submit) {
      const missing = STEPS.findIndex(each => each.required && !parts[each.part].trim())
      if (missing >= 0) {
        setStep(missing)
        setProblem(STEPS[missing].required)
        return
      }
    }
    save.mutate({ weekStart: report.weekStart, submit, ...parts }, {
      onSuccess: saved => {
        toast.add({
          type: "success",
          title: submit ? (wasSubmitted ? "주간보고를 고쳤습니다" : "주간보고를 제출했습니다") : "임시 저장했습니다",
          description: submit ? weekText(saved.weekStart) : "제출하기 전에는 나만 볼 수 있습니다.",
        })
        if (submit) onSaved(saved)
      },
    })
  }
  const advance = () => {
    if (!isLast) {
      if (current.required && !parts[current.part].trim()) setProblem(current.required)
      else move(step + 1)
      return
    }
    store(true)
  }
  const submit = (event: FormEvent) => { event.preventDefault(); advance() }
  const keyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); advance() }
  }

  return (
    <form id={WRITE_FORM_ID} onSubmit={submit} onKeyDown={keyDown} className={cn("flex min-h-0 flex-1 flex-col", isPage && "bg-background")}>
      <div className={cn("flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto", isPage ? "mx-auto w-full max-w-180 px-4 pt-5 pb-6" : "px-10 pt-1 pb-2")}>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tabular-nums">{weekText(report.weekStart)} 주간보고</h1>
          <p className="text-xs text-muted-foreground tabular-nums">마감 {dueText(report.weekStart)} · {ME.name}</p>
        </div>
        <Steps step={step} onStep={move} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${WRITE_FORM_ID}-${current.part}`} className="text-xs font-medium text-muted-foreground">{current.label}</label>
          {step === 0 && prefill && report.state === "none" && parts.thisWeek === prefill && (
            <p className="text-xs text-muted-foreground">지난주 차주 계획을 가져왔어요. 이번 주에 한 일로 고쳐 주세요.</p>
          )}
          <textarea key={current.part} id={`${WRITE_FORM_ID}-${current.part}`} autoFocus value={parts[current.part]} placeholder={current.placeholder}
            aria-invalid={problem ? true : undefined} aria-describedby={problem ? `${WRITE_FORM_ID}-problem` : undefined}
            onChange={event => { setProblem(undefined); setParts(old => ({ ...old, [current.part]: event.target.value })) }}
            className="field-sizing-content min-h-48 w-full resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-muted-foreground/70 max-md:text-base" />
          {problem
            ? <p id={`${WRITE_FORM_ID}-problem`} role="alert" className="text-sm text-destructive">{problem}</p>
            : <p className="text-xs text-muted-foreground">Markdown으로 씁니다. 목록은 "- ", 굵게는 **두 별표**.</p>}
        </div>
        <div role="group" aria-label="속성" className="flex flex-wrap gap-1.5">
          <OptionPill label="주" icon={CalendarIcon} value={report.weekStart} options={weekOptions(thisWeek)} onChange={onWeek} />
        </div>
        {wasSubmitted && <p className="text-xs text-muted-foreground">이미 제출한 보고입니다. 저장하면 고친 내용으로 바뀌고 확인을 다시 받습니다.</p>}
      </div>
      <footer className={cn("flex shrink-0 items-center gap-2", isPage ? "border-t bg-background px-4 py-2" : "px-10 pt-2 pb-8")}>
        <span className="mr-auto flex items-center gap-1">
          {step > 0 && <Button type="button" variant="ghost" onClick={() => move(step - 1)} className="max-md:h-11">이전</Button>}
          {!wasSubmitted && (
            <Button type="button" variant="ghost" disabled={save.isPending} onClick={() => store(false)} className="max-md:h-11">임시 저장</Button>
          )}
        </span>
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel} className="max-md:h-11">취소</Button>}
        <Button type="submit" disabled={save.isPending} className="rounded-full px-4 max-md:h-11">
          {isLast ? (wasSubmitted ? "저장" : "제출") : "다음"}
        </Button>
      </footer>
    </form>
  )
}

/** 내 보고를 읽어 양식을 그린다. 주를 바꾸면 그 주의 보고로 새로 그린다. */
export function WriteForm({ week, ...props }: Omit<FormProps, "report" | "prefill"> & { week: string }) {
  const { data } = useMyWeeklyReport(week)
  if (!data) {
    return (
      <div aria-busy="true" aria-label="주간보고를 읽는 중" className="flex flex-col gap-4 px-10 py-8 max-md:px-4">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }
  return <ReportForm key={data.report.weekStart} report={data.report} prefill={data.prefill} {...props} />
}
