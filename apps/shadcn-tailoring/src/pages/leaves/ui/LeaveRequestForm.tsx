import { useId, type ReactNode } from "react"
import { dateText, dayText, HALF_DAYS, LEAVE_TYPES, leaveTypeMark, type HalfDay, type LeaveType } from "@/entities/leave"
import { Field, FieldDescription, FieldLabel } from "@/shared/ui/field"
import { ClockIcon, UmbrellaIcon } from "@/shared/ui/icon"
import { Progress } from "@/shared/ui/progress"
import { DatePill, OptionPill } from "@/shared/ui/property-pill"
import { Textarea } from "@/shared/ui/textarea"

export type LeaveDraft = { type: LeaveType; half: HalfDay; startDate?: string; endDate?: string; reason: string }
type DraftProps = { draft: LeaveDraft; onDraft: (draft: LeaveDraft) => void }

/**
 * 구분 · 날짜 · (반차면) 시간대 알약(호호코워크 LeaveDateStep의 알약 줄). 시작일을 고르면 종료일이 비었거나 앞일 때 같은 날로 맞춘다.
 * ComposeSurface가 데스크톱은 양식 아래, 휴대폰은 바닥 줄 위에 둔다.
 */
export function LeavePills({ draft, onDraft }: DraftProps) {
  const set = (change: Partial<LeaveDraft>) => onDraft({ ...draft, ...change })
  const isHalf = draft.type === "half"
  return (
    <>
      <OptionPill label="구분" icon={UmbrellaIcon} showLabel value={draft.type} onChange={type => set({ type })}
        options={LEAVE_TYPES.map(type => ({ value: type.value, label: type.label, icon: <type.icon /> }))} />
      <DatePill label={isHalf ? "날짜" : "시작일"} value={draft.startDate} format={dateText}
        onChange={startDate => set({ startDate, endDate: !draft.endDate || (startDate && draft.endDate < startDate) ? startDate : draft.endDate })} />
      {isHalf ? (
        <OptionPill label="시간대" icon={ClockIcon} value={draft.half} onChange={half => set({ half })}
          options={HALF_DAYS.map(half => ({ value: half.value, label: half.label, end: <span className="text-xs text-muted-foreground tabular-nums">{half.time}</span> }))} />
      ) : (
        <DatePill label="종료일" value={draft.endDate} format={dateText} onChange={endDate => set({ endDate })} />
      )}
    </>
  )
}

/** 이번 신청이 쓰는 일수와 신청 가능한 연차(호호코워크 BalanceMeter). 병가는 연차에서 빠지지 않아 막대 없이 일수만. */
function BalanceMeter({ days, available, isAnnual }: { days?: number; available: number; isAnnual: boolean }) {
  const used = days ?? 0
  const isOver = isAnnual && used > available
  return (
    <div aria-live="polite" className="flex flex-col gap-2 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">이번 신청</span>
        <span className="font-semibold tabular-nums">{days === undefined ? "—" : dayText(used)}</span>
      </div>
      {isAnnual ? (
        <>
          <Progress aria-label={`신청 가능 ${dayText(available)} 중 ${dayText(used)} 사용`} value={Math.min(used, available)} max={Math.max(available, 1)} />
          <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground tabular-nums">
            <span>신청 가능 {dayText(available)}</span>
            <span className={isOver ? "text-destructive" : undefined}>
              {isOver ? `${dayText(used - available)} 부족` : `신청 후 ${dayText(Math.max(available - used, 0))}`}
            </span>
          </div>
        </>
      ) : <p className="text-sm text-muted-foreground">병가는 연차에서 빠지지 않습니다. 사흘이 넘으면 진단서를 결재자에게 따로 냅니다.</p>}
    </div>
  )
}

/**
 * 휴가 신청의 본문(호호코워크 LeaveRequestForm 첫 단계): 이름과 안내, (데스크톱) 알약, 고른 종류의 설명과 문제, 쓰는 일수와 남는 연차, 사유.
 */
export function LeaveDetails({ draft, onDraft, days, available, error, pills }: DraftProps & {
  /** 고른 날짜로 센 일수. 날짜를 다 고르기 전에는 undefined. */
  days?: number; available: number; error?: string
  /** 데스크톱은 알약을 이름 아래(설명 위)에 둔다. 휴대폰은 ComposeSurface가 바닥 줄 위에 고정한다. */
  pills?: ReactNode
}) {
  const reasonId = useId()
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight max-md:text-xl">휴가 신청</h1>
        <p className="text-muted-foreground">신청한 뒤의 진행 상황은 근태 · 휴가의 신청 내역에서 확인합니다.</p>
      </header>
      <div className="flex flex-col gap-2">
        {pills && <div role="group" aria-label="종류와 기간" className="flex flex-wrap items-center gap-1.5">{pills}</div>}
        <p className="text-sm text-muted-foreground">{leaveTypeMark(draft.type).description} 주말은 세지 않습니다.</p>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </div>
      <BalanceMeter days={days} available={available} isAnnual={draft.type !== "sick"} />
      <Field>
        <FieldLabel htmlFor={reasonId}>사유</FieldLabel>
        <Textarea id={reasonId} rows={4} maxLength={1000} value={draft.reason} onChange={event => onDraft({ ...draft, reason: event.target.value })}
          placeholder="결재자가 확인할 사유와 업무 인수인계를 적어 주세요." />
        <FieldDescription>신청하면 팀장(이도윤)에게 결재가 올라갑니다.</FieldDescription>
      </Field>
    </div>
  )
}
