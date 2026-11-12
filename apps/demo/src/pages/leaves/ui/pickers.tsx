import type { Holiday } from "@/entities/holiday"
import {
  dateText, kindLabels, LEAVE_KINDS, periodText, slotLabels, slotRange, specialNote, type LeaveKind, type LeaveSlot, type SlotOption,
  type SpecialType,
} from "@/entities/leave"
import { cn } from "cn"
import { CalendarIcon, ClockIcon, StarIcon, UmbrellaIcon } from "@/shared/ui/icon"
import { OptionPill, PropertyPill } from "@/shared/ui/property-pill"
import type { DateDraft } from "../model/new-request"
import { LeaveCalendar } from "./LeaveCalendar"

/** 고르는 카드(호호코워크 SelectableCard): 고르면 강조 테두리, 못 고르면 흐리게. 휴대폰 시트에서는 줄을 다 쓴다. */
const CARD = cn(
  "flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg border bg-card px-3 py-2.5 text-center outline-none",
  "hover:bg-row-hover focus-visible:ring-2 focus-visible:ring-ring aria-checked:border-primary aria-checked:ring-1 aria-checked:ring-primary",
  "disabled:pointer-events-none disabled:opacity-50 max-md:min-h-16",
)

const slotNames: Partial<Record<LeaveSlot, string>> = { HALF_DAY_AM: "오전", HALF_DAY_PM: "오후" }

/** 그날의 시간대(호호코워크 SlotPicker): 칸마다 이름과 시간, 이미 신청한 칸은 고를 수 없다. */
export function SlotPicker({ options, value, onChange }: { options: readonly SlotOption[]; value?: LeaveSlot; onChange: (slot: LeaveSlot) => void }) {
  if (options.length === 0) return <p className="p-2 text-sm text-muted-foreground">날짜를 고르면 그날의 시간대가 나옵니다.</p>
  return (
    <div role="radiogroup" aria-label="시간대" className="grid grid-cols-2 gap-2 p-1.5">
      {options.map(option => {
        const name = slotNames[option.slot]
        return (
          <button key={option.slot} type="button" role="radio" aria-checked={value === option.slot} disabled={option.state !== "open"}
            aria-label={`${slotLabels[option.slot]} ${slotRange(option.slot)}`} onClick={() => onChange(option.slot)} className={CARD}>
            <span className="text-sm font-semibold">{name ?? slotLabels[option.slot]}</span>
            <span className="text-xs text-muted-foreground tabular-nums">{slotRange(option.slot)}</span>
            {option.state === "taken" && <span className="text-xs text-muted-foreground">이미 신청함</span>}
          </button>
        )
      })}
    </div>
  )
}

/**
 * 특별휴가 고르기(호호코워크 SpecialTypePicker): 카드마다 이름과 남은 일수. 남은 것이 없는 휴가는 뒤로 가고 고를 수 없다.
 */
export function SpecialTypePicker({ types, value, onChange }: { types: readonly SpecialType[]; value?: string; onChange: (type: SpecialType) => void }) {
  const isEmpty = (type: SpecialType) => type.available !== undefined && type.available <= 0
  const ordered = [...types.filter(type => !isEmpty(type)), ...types.filter(isEmpty)]
  return (
    <div role="radiogroup" aria-label="휴가 종류" className="grid grid-cols-2 gap-2 p-1.5">
      {ordered.map(type => (
        <button key={type.id} type="button" role="radio" aria-checked={value === type.id} disabled={isEmpty(type)}
          onClick={() => onChange(type)} className={CARD}>
          <span className="truncate text-sm font-semibold">{type.name}</span>
          <span className="text-xs text-muted-foreground tabular-nums">{specialNote(type)}</span>
        </button>
      ))}
    </div>
  )
}

/** 구분 알약: 하루 이상 · 반차 · 반반차. */
export function KindPill({ value, onChange }: { value: LeaveKind; onChange: (kind: LeaveKind) => void }) {
  return (
    <OptionPill label="구분" icon={UmbrellaIcon} showLabel value={value} onChange={onChange}
      options={LEAVE_KINDS.map(kind => ({ value: kind, label: kindLabels[kind] }))} />
  )
}

/** 기간(하루 이상) · 날짜(반차 · 반반차) 알약. 누르면 달력이 뜨고, 다 고르면 닫힌다. */
export function DatesPill({ draft, min, max, holidays, isOpen, onPick }: {
  draft: DateDraft; min: string; max: string; holidays: readonly Holiday[]
  isOpen: (iso: string) => boolean; onPick: (start: string, end: string) => void
}) {
  const isRange = draft.kind === "FULL"
  const text = draft.start ? (isRange && draft.end ? periodText(draft.start, draft.end) : dateText(draft.start)) : undefined
  return (
    <PropertyPill label={isRange ? "기간" : "날짜"} icon={<CalendarIcon />} text={text} width="w-auto">
      {close => (
        <LeaveCalendar mode={isRange ? "range" : "single"} start={draft.start} end={draft.end} min={min} max={max} holidays={holidays}
          isOpen={isOpen} onPick={(start, end) => { onPick(start, end); close() }} />
      )}
    </PropertyPill>
  )
}

/** 시간대 알약: 고른 날의 칸 중 하나. */
export function SlotPill({ options, value, onChange }: { options: readonly SlotOption[]; value?: LeaveSlot; onChange: (slot: LeaveSlot) => void }) {
  return (
    <PropertyPill label="시간대" icon={<ClockIcon />} text={value && `${slotLabels[value]} · ${slotRange(value)}`} width="w-80">
      {close => <SlotPicker options={options} value={value} onChange={slot => { onChange(slot); close() }} />}
    </PropertyPill>
  )
}

/** 특별휴가 종류 알약. */
export function SpecialTypePill({ types, value, onChange }: { types: readonly SpecialType[]; value?: SpecialType; onChange: (type: SpecialType) => void }) {
  return (
    <PropertyPill label="휴가 종류" icon={<StarIcon />} text={value?.name} width="w-96">
      {close => <SpecialTypePicker types={types} value={value?.id} onChange={type => { onChange(type); close() }} />}
    </PropertyPill>
  )
}
