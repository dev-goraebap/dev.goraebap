import { useNavigate } from "@tanstack/react-router"
import { useId, useMemo, useState } from "react"
import { closedDays, useHolidays } from "@/entities/holiday"
import {
  addDays, bookingsOf, dayOpen, dayText, leaveDays, periodText, rangeClashes, slotLabels, slotOptions, slotRange, specialRules, todayIso,
  useLeaveRequests, useLeaveSummary, useRequestLeave, useSpecialTypes, useSuggestedLine, usageText, type Approver, type LeaveKind,
  type LeaveSlot,
} from "@/entities/leave"
import { paths } from "@/shared/config"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Field, FieldLabel } from "@/shared/ui/field"
import { PageState } from "@/shared/ui/page-state"
import { Skeleton } from "@/shared/ui/skeleton"
import { Spinner } from "@/shared/ui/spinner"
import { Textarea } from "@/shared/ui/textarea"
import { toast } from "@/shared/ui/toast"
import { hasFinal, lineChanged, STEPS, type RequestKind, type SpecialDraft } from "../model/new-request"
import { ApprovalStep } from "./ApprovalStep"
import { DatesPill, KindPill, SlotPill, SpecialTypePill } from "./pickers"
import { RequestFrame } from "./RequestFrame"
import { StepIndicator } from "./StepIndicator"

const TITLES: Record<RequestKind, string> = { annual: "연차 신청", special: "특별휴가 신청" }

/** 확인 단계의 줄: 결재자가 읽을 사실 한 줄씩(호호코워크 ReviewList). */
function ReviewList({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid grid-cols-[6rem_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="break-words">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * 휴가 신청 세 단계(호호코워크 LeaveRequestForm): ① 휴가 정보 — 연차는 구분 · 기간(날짜) · 시간대, 특별휴가는 종류부터 고르고,
 * 쓰는 일수와 남는 일수, 사유. ② 결재선. ③ 확인 뒤 신청. 달력은 열린 근무일만 고르게 하고, 일수는 주말과 공휴일을 빼고 센다
 * (달력일 기준 특별휴가는 모두 센다). 겹침 · 초과는 바로, 안 고른 것은 다음을 누른 뒤에 말한다. 보내면 신청 목록 캐시에
 * 들어가고 알린 뒤 근태 · 휴가로 돌아간다.
 */
export function LeaveRequestForm({ mode, initialTypeId, initialDate }: { mode: RequestKind; initialTypeId?: SpecialDraft["typeId"]; initialDate?: string }) {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const reasonId = useId()
  const [today] = useState(todayIso)
  const max = addDays(today, 365)

  const requests = useLeaveRequests()
  const summary = useLeaveSummary()
  const catalog = useSpecialTypes()
  const holidays = useHolidays()
  const suggested = useSuggestedLine()
  const submit = useRequestLeave()
  const closed = useMemo(() => closedDays(holidays.data ?? []), [holidays.data])
  const bookings = bookingsOf(requests.data ?? [])

  const [step, setStep] = useState(0)
  const [isTried, setTried] = useState(false)
  const [draft, setDraft] = useState<SpecialDraft>(() => (initialDate && initialDate >= today && initialDate <= max
    ? { kind: "FULL", typeId: initialTypeId, start: initialDate, end: initialDate } : { kind: "FULL", typeId: initialTypeId }))
  const [reason, setReason] = useState("")
  const [line, setLine] = useState<Approver[] | null>(null)

  // 첫 단계: 고른 것에서 칸 · 겹침 · 일수를 센다.
  const type = mode === "special" ? catalog.data?.find(item => item.id === draft.typeId) : undefined
  const countsAllDays = type?.durationBasis === "CALENDAR_DAY"
  const isPartial = draft.kind !== "FULL"
  const end = isPartial ? draft.start : draft.end
  const options = isPartial && draft.start ? slotOptions(draft.start, draft.kind, bookings) : []
  const slot: LeaveSlot | undefined = isPartial ? options.find(option => option.slot === draft.slot && option.state === "open")?.slot : "FULL_DAY"
  const isClash = !isPartial && !!draft.start && !!end && rangeClashes(draft.start, end, bookings)
  const isReady = (mode === "annual" || !!type) && !!slot && !!draft.start && !!end && !isClash
  const days = isReady ? leaveDays({ slot: slot!, start: draft.start!, end: end!, basis: type?.durationBasis, closed }) : undefined
  const available = mode === "annual" ? summary.data?.available : type?.available
  const usage = usageText(days, available)
  const isTooLong = type?.maxDays !== undefined && days !== undefined && days > type.maxDays
  const isOpen = (iso: string) => dayOpen(iso, draft.kind, bookings, closed, countsAllDays && !isPartial)

  const pickError = mode === "special" && !type ? "특별휴가를 고르세요."
    : !draft.start ? (isPartial ? "달력에서 날짜를 고르세요." : "달력에서 기간을 고르세요.")
      : !isPartial && !draft.end ? "마지막 날을 고르세요."
        : isClash ? "이미 신청한 휴가와 기간이 겹칩니다."
          : isPartial && !slot ? "시간대를 고르세요."
            : undefined
  const dateError = pickError
    ?? (usage.isOver ? (mode === "annual" ? "신청 가능 일수를 넘습니다." : "남은 일수를 넘습니다.")
      : isTooLong ? `${type!.name}${hasFinal(type!.name) ? "은" : "는"} 한 번에 ${type!.maxDays}일까지 쓸 수 있습니다.` : undefined)
  const shownDateError = isTried || isClash || usage.isOver || isTooLong ? dateError : undefined
  const isReasonRequired = !!type?.requiresReason
  const reasonError = isReasonRequired && !reason.trim() ? `${type!.name}${hasFinal(type!.name) ? "은" : "는"} 사유를 적어야 합니다.` : undefined

  // 둘째 단계: 고치기 전에는 조직의 결재선. 비어 있으면 결재 없이 승인된다.
  const isAutoApproved = suggested.data?.length === 0
  const approvers = line ?? suggested.data ?? []
  const lineError = !isAutoApproved && suggested.isSuccess && approvers.length === 0 ? "결재자를 한 명 이상 지정해 주세요." : undefined
  const isBlocked = step === 0 ? !!dateError || !!reasonError : step === 1 ? !!lineError || suggested.isPending : false

  const name = mode === "annual" ? "연차" : type?.name ?? "특별휴가"
  const go = (next: number) => { setTried(false); setStep(next) }
  const close = () => void navigate({ to: paths.leaves })
  const advance = () => {
    if (submit.isPending) return
    if (isBlocked) return setTried(true)
    if (step < STEPS.length - 1) return go(step + 1)
    if (dateError || reasonError) { setStep(0); return setTried(true) }
    if (lineError) { setStep(1); return setTried(true) }
    submit.mutate({
      type: mode === "annual" ? "annual" : type!.id, slot: slot!, startDate: draft.start!, endDate: end!, days: days!,
      reason: reason.trim() || undefined, approvers: isAutoApproved ? [] : approvers,
    }, {
      onSuccess: sent => {
        const isApproved = sent.status === "approved"
        toast.add({
          type: "success",
          title: isApproved ? "휴가가 승인되었습니다" : "휴가 신청을 보냈습니다",
          description: `${periodText(sent.startDate, sent.endDate)} · ${dayText(sent.days)}${isApproved ? "" : ` · ${sent.approvers[0]?.name} 님부터 결재합니다.`}`,
        })
        close()
      },
    })
  }
  const changeKind = (kind: LeaveKind) => {
    const start = draft.start && dayOpen(draft.start, kind, bookings, closed, countsAllDays && kind === "FULL") ? draft.start : undefined
    setDraft({ ...draft, kind, start, end: kind === "FULL" ? start : undefined, slot: undefined })
  }

  const isLoading = requests.isPending || summary.isPending || catalog.isPending || holidays.isPending
  const isFailed = requests.isError || summary.isError || catalog.isError || holidays.isError
  const isLast = step === STEPS.length - 1
  const actions = (
    <>
      {step > 0 && isMobile
        ? <Button variant="ghost" className="h-11 px-4" disabled={submit.isPending} onClick={() => go(step - 1)}>이전</Button>
        : <Button variant="ghost" className="max-md:h-11 max-md:px-4" disabled={submit.isPending} onClick={close}>취소</Button>}
      {step > 0 && !isMobile && <Button variant="secondary" className="ml-auto" disabled={submit.isPending} onClick={() => go(step - 1)}>이전</Button>}
      <Button className={isMobile ? "h-11 flex-1 rounded-full" : step > 0 ? "rounded-full px-3" : "ml-auto rounded-full px-3"}
        disabled={isLoading || isFailed || submit.isPending} onClick={advance}>
        {submit.isPending && <Spinner data-icon="inline-start" />}
        {!isLast ? "다음" : isAutoApproved ? "신청하고 승인받기" : "신청하기"}
      </Button>
    </>
  )

  const range = slot && slotRange(slot)
  const reviewRows: [string, string][] = [
    ["종류", `${name} · ${slotLabels[slot ?? "FULL_DAY"]}${range ? ` · ${range}` : ""}`],
    ["날짜", draft.start && end ? periodText(draft.start, end) : ""],
    ["사용 일수", usage.text ?? ""],
    ["결재선", isAutoApproved ? "결재 없이 바로 승인" : approvers.map(person => person.name).join(" → ")],
    ["사유", reason.trim() || "없음"],
  ]

  return (
    <RequestFrame title={TITLES[mode]} actions={actions}>
      <StepIndicator steps={STEPS} current={step} onStep={index => { if (index < step) go(index) }} />
      {isLoading ? <Skeleton aria-label="신청에 필요한 정보를 불러오는 중" className="h-40 w-full" />
        : isFailed ? <PageState kind="error" isCompact title="신청에 필요한 정보를 불러오지 못했습니다" description="잠시 뒤 다시 열어 주세요." />
          : (
            <>
              {step === 0 && (
                <div className="flex flex-col gap-5">
                  {mode === "special" && type && (
                    <div className="flex flex-col gap-2">
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                      <ul aria-label="이 휴가의 조건" className="flex flex-wrap gap-1">
                        {specialRules(type).map(rule => <li key={rule}><Badge variant="secondary">{rule}</Badge></li>)}
                      </ul>
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <div role="group" aria-label="종류와 기간" className="flex flex-wrap items-center gap-1.5">
                      {mode === "special" && (
                        <SpecialTypePill types={catalog.data ?? []} value={type}
                          onChange={next => setDraft({ typeId: next.id, kind: "FULL" })} />
                      )}
                      {(mode === "annual" || type) && (
                        <>
                          <KindPill value={draft.kind} onChange={changeKind} />
                          <DatesPill draft={draft} min={today} max={max} holidays={holidays.data ?? []} isOpen={isOpen}
                            onPick={(start, last) => setDraft({ ...draft, start, end: isPartial ? undefined : last, slot: undefined })} />
                          {isPartial && <SlotPill options={options} value={slot} onChange={next => setDraft({ ...draft, slot: next })} />}
                        </>
                      )}
                    </div>
                    <p aria-live="polite" className="text-sm text-muted-foreground tabular-nums">
                      {usage.text ?? (available !== undefined ? `${mode === "annual" ? "신청 가능" : "남은"} ${dayText(available)}` : "날짜를 고르면 사용 일수를 계산합니다.")}
                      {` · ${countsAllDays && !isPartial ? "주말·공휴일 포함" : "근무일 기준, 주말·공휴일 제외"}`}
                    </p>
                    {shownDateError && <p role="alert" className="text-sm text-destructive">{shownDateError}</p>}
                  </div>
                  <Field>
                    <FieldLabel htmlFor={reasonId}>{isReasonRequired ? "사유 (필수)" : "사유"}</FieldLabel>
                    <Textarea id={reasonId} rows={4} maxLength={1000} value={reason} onChange={event => setReason(event.target.value)}
                      aria-invalid={isTried && !!reasonError} placeholder="결재자가 확인할 사유와 업무 인수인계를 적어 주세요." />
                    {isTried && reasonError && <p role="alert" className="text-sm text-destructive">{reasonError}</p>}
                  </Field>
                </div>
              )}
              {step === 1 && (
                <ApprovalStep line={approvers} onLineChange={setLine} isAutoApproved={isAutoApproved} isLoading={suggested.isPending}
                  isChanged={suggested.isSuccess && lineChanged(approvers, suggested.data)} error={isTried ? lineError : undefined} />
              )}
              {step === 2 && (
                <div className="flex flex-col gap-4">
                  <ReviewList rows={reviewRows} />
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" onClick={() => go(0)}>정보 수정</Button>
                    <Button variant="secondary" size="sm" onClick={() => go(1)}>결재선 수정</Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isAutoApproved ? `신청하면 바로 승인되고 ${name}에서 빠집니다.`
                      : available !== undefined ? `마지막 결재자가 승인하면 ${name}에서 빠집니다. 승인 전에는 결재 중으로 남은 일수에서 미리 뺍니다.`
                        : "마지막 결재자가 승인하면 휴가가 확정됩니다."}
                  </p>
                  {submit.error && <p role="alert" className="text-sm text-destructive">{submit.error.message}</p>}
                </div>
              )}
            </>
          )}
    </RequestFrame>
  )
}
