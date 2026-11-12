import { useState, type ComponentProps } from "react"
import {
  ME, WEEKS, dueText, isSubmitted, shiftWeek, useSaveWeeklyReport, weekName, weekText, type ReportParts, type WeeklyReport,
} from "@/entities/weekly-report"
import { Button } from "@/shared/ui/button"
import { ComposeSurface } from "@/shared/ui/compose"
import { CalendarIcon } from "@/shared/ui/icon"
import { OptionPill } from "@/shared/ui/property-pill"
import { toast } from "@/shared/ui/toast"
import { carryDraft, useCarriedDraft } from "@/shared/lib/panel"

/** 회사 양식의 세 단계(호호코워크 WeeklyReportCompose). 비고만 비워도 된다. */
const STEPS: readonly { part: keyof ReportParts; label: string; placeholder: string; required?: string }[] = [
  { part: "thisWeek", label: "금주 주간보고", placeholder: "이번 주에 한 일을 적어 주세요", required: "이번 주에 한 일을 적어 주세요." },
  { part: "nextWeek", label: "차주 주간계획", placeholder: "다음 주에 할 일을 적어 주세요", required: "다음 주에 할 일을 적어 주세요." },
  { part: "note", label: "비고", placeholder: "건의하거나 함께 검토할 일이 있으면 적어 주세요" },
]

const FIELD_ID = "weekly-report-write"

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

/** 양식이 놓이는 곳(ComposeSurface)의 값: 대화상자 · 페이지, 경로, 부서 칩, 닫기. WriteSurface가 정한다. */
export type WritePlace = Pick<ComponentProps<typeof ComposeSurface>, "surface" | "crumbs" | "chip" | "onClose">

type Carried = { parts: ReportParts; step: number }
const carryKey = (weekStart: string) => `weekly:${weekStart}`

/**
 * 한 주의 내 보고 양식(호호코워크 WeeklyReportCompose의 PaperForm): 주가 이름이 되는 제목, 마감과 작성자, 단계 표시, 지금 단계의
 * Markdown 칸, 주 알약. 놓이는 곳은 다른 양식과 같은 ComposeSurface이고, 바닥 줄 앞쪽에 이전 · 임시 저장(제출 전만),
 * 만들기 자리에 다음 또는 제출(제출한 보고는 저장)을 둔다. 채우지 않은 단계의 까닭은 바닥 줄(error)이 알린다.
 * Ctrl/⌘+Enter가 바닥 줄의 주 동작이다. 크게 보기는 쓰던 세 단계와 지금 단계를 페이지로 넘긴다.
 */
export function WriteForm({ report, prefill, thisWeek, onWeek, onSaved, onExpand, ...place }: WritePlace & {
  report: WeeklyReport
  /** 새로 쓸 때 금주 실적의 처음 값(지난주의 차주 계획). */
  prefill?: string
  thisWeek: string
  onWeek: (week: string) => void
  onSaved: (report: WeeklyReport) => void
  /** 크게 보기: 같은 양식을 자기 페이지로. 대화상자에만 있다. */
  onExpand?: () => void
}) {
  const save = useSaveWeeklyReport()
  const carried = useCarriedDraft<Carried>(carryKey(report.weekStart))
  const [parts, setParts] = useState<ReportParts>(() => carried?.parts ?? { thisWeek: report.thisWeek || prefill || "", nextWeek: report.nextWeek, note: report.note })
  const [step, setStep] = useState(() => carried?.step ?? 0)
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
  const expand = onExpand && !save.isPending
    ? () => { carryDraft(carryKey(report.weekStart), { parts, step } satisfies Carried); onExpand() }
    : undefined
  const hasActions = step > 0 || !wasSubmitted

  return (
    <ComposeSurface {...place} onExpand={expand} error={problem}
      submit={{ label: isLast ? (wasSubmitted ? "저장" : "제출") : "다음", onSubmit: advance, isPending: save.isPending }}
      actions={hasActions && <>
        {step > 0 && <Button variant="ghost" onClick={() => move(step - 1)}>이전</Button>}
        {!wasSubmitted && <Button variant="ghost" disabled={save.isPending} onClick={() => store(false)}>임시 저장</Button>}
      </>}
      pills={<OptionPill label="주" icon={CalendarIcon} value={report.weekStart} options={weekOptions(thisWeek)} onChange={onWeek} />}>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tabular-nums">{weekText(report.weekStart)} 주간보고</h1>
        <p className="text-xs text-muted-foreground tabular-nums">마감 {dueText(report.weekStart)} · {ME.name}</p>
      </div>
      <Steps step={step} onStep={move} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${FIELD_ID}-${current.part}`} className="text-xs font-medium text-muted-foreground">{current.label}</label>
        {step === 0 && prefill && report.state === "none" && parts.thisWeek === prefill && (
          <p className="text-xs text-muted-foreground">지난주 차주 계획을 가져왔어요. 이번 주에 한 일로 고쳐 주세요.</p>
        )}
        <textarea key={current.part} id={`${FIELD_ID}-${current.part}`} autoFocus value={parts[current.part]} placeholder={current.placeholder}
          aria-invalid={problem ? true : undefined}
          onChange={event => { setProblem(undefined); setParts(old => ({ ...old, [current.part]: event.target.value })) }}
          className="field-sizing-content min-h-48 w-full resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-muted-foreground/70 max-md:text-base" />
        <p className="text-xs text-muted-foreground">Markdown으로 씁니다. 목록은 "- ", 굵게는 **두 별표**.</p>
      </div>
      {wasSubmitted && <p className="text-xs text-muted-foreground">이미 제출한 보고입니다. 저장하면 고친 내용으로 바뀌고 확인을 다시 받습니다.</p>}
    </ComposeSurface>
  )
}
