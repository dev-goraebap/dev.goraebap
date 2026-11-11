import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { dayText, halfDayMark, leaveDays, leaveTypeMark, periodText, useLeaveSummary, useRequestLeave } from "@/entities/leave"
import { paths } from "@/shared/config"
import { useIsMobile } from "@/shared/lib/use-mobile"
import { ComposeSurface } from "@/shared/ui/compose"
import { ClockIcon } from "@/shared/ui/icon"
import { toast } from "@/shared/ui/toast"
import { LeaveDetails, LeavePills, type LeaveDraft } from "./LeaveRequestForm"

/** 고른 것으로 못 보내는 이유. 없으면 보낼 수 있다. */
function problemOf(draft: LeaveDraft, days: number | undefined, available: number) {
  if (!draft.startDate) return "날짜를 고르세요."
  if (draft.type !== "half" && !draft.endDate) return "종료일을 고르세요."
  if (draft.type !== "half" && draft.endDate! < draft.startDate) return "종료일이 시작일보다 앞입니다."
  if (days === 0) return "고른 기간에 근무일이 없습니다."
  if (draft.type !== "sick" && days !== undefined && days > available) return "신청 가능 일수를 넘습니다."
  return undefined
}

/**
 * 휴가 신청(/leaves/new, 호호코워크 RequestComposer의 연차 신청). 데스크톱은 자기 페이지(45rem 단, 끝에 취소 · 신청하기),
 * 휴대폰은 하단 탭 없는 전체 화면에 알약 줄과 바닥 동작 줄(ComposeSurface). 보내면 승인 대기로 목록에 들어가고
 * 알린 뒤 근태 · 휴가로 돌아간다.
 */
export function LeaveNewPage() {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const summary = useLeaveSummary()
  const request = useRequestLeave()
  const [draft, setDraft] = useState<LeaveDraft>({ type: "annual", half: "am", reason: "" })
  const [isTried, setTried] = useState(false)

  const end = draft.type === "half" ? draft.startDate : draft.endDate
  const days = draft.startDate && end && end >= draft.startDate ? leaveDays(draft.type, draft.startDate, end) : undefined
  const available = summary.data?.available ?? 0
  const problem = problemOf(draft, days, available)
  // 초과 · 근무일 없음은 바로, 아직 안 고른 것은 보내려 한 뒤에 말한다.
  const shown = isTried || days !== undefined ? problem : undefined

  const pills = <LeavePills draft={draft} onDraft={setDraft} />
  const close = () => void navigate({ to: paths.leaves })
  const submit = () => {
    setTried(true)
    if (problem || !draft.startDate || !end) return
    request.mutate({
      type: draft.type, half: draft.type === "half" ? draft.half : undefined, startDate: draft.startDate, endDate: end,
      reason: draft.reason.trim() || undefined,
    }, {
      onSuccess: sent => {
        const name = sent.half ? halfDayMark(sent.half).label : leaveTypeMark(sent.type).label
        toast.add({ type: "success", title: "휴가 신청을 보냈습니다", description: `${name} · ${periodText(sent.startDate, sent.endDate)} · ${dayText(sent.days)}` })
        close()
      },
    })
  }

  return (
    <ComposeSurface surface="page" onClose={close}
      crumbs={[{ label: "근태 · 휴가", href: paths.leaves }, { label: "휴가 신청", icon: ClockIcon }]}
      pills={isMobile ? pills : undefined}
      submit={{ label: "신청하기", onSubmit: submit, isDisabled: summary.isPending, isPending: request.isPending }}>
      <LeaveDetails draft={draft} onDraft={setDraft} days={days} available={available} error={shown} pills={isMobile ? undefined : pills} />
    </ComposeSurface>
  )
}
