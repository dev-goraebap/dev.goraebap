import { cva } from "class-variance-authority"
import { useState, type ComponentProps, type ReactNode } from "react"
import { toggleValue } from "@/shared/lib/toggle"
import { cn } from "@/shared/lib/utils"
import { AdaptivePopover } from "@/shared/ui/adaptive-popover"
import { Button } from "@/shared/ui/button"
import { DateCalendar } from "@/shared/ui/date-picker"
import { CalendarIcon, XIcon, type Icon } from "@/shared/ui/icon"
import { OptionList, type Option } from "@/shared/ui/option-list"

/**
 * 속성 알약의 모양(호호코워크 compose.module.css의 .pill). 24px 둥근 알약: 옅은 바탕, 가는 안쪽 테두리, 12px 글자, 14px 표식.
 * 휴대폰은 44px · 15px. 비어 있으면 보조 글자색.
 * 상세의 넓은 옆 칸(DetailLayout의 @container/detail이 60rem 이상)에서는 같은 알약이 테두리와 바탕 없는 32px 줄이 된다.
 * 누르는 알약(PropertyPill)은 가리킴 · 초점 · 열림을 보이고, 읽기만 하는 알약(InfoPill)은 interactive: false다.
 * 제출 검사에서 빠진 필수 속성(aria-invalid)은 오류 색 테두리와 글자다.
 */
export const pillVariants = cva([
  "inline-flex h-6 max-w-64 min-w-0 shrink items-center gap-1.5 rounded-full bg-muted pr-2.5 pl-2 text-xs font-medium text-foreground",
  "ring-1 ring-input ring-inset data-empty:text-muted-foreground",
  "[&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  "max-md:h-11 max-md:pr-3 max-md:pl-2.5 max-md:text-sm",
  "@min-[60rem]/detail:h-8 @min-[60rem]/detail:max-w-full @min-[60rem]/detail:rounded-lg @min-[60rem]/detail:bg-transparent @min-[60rem]/detail:px-2",
  "@min-[60rem]/detail:text-[0.875rem] @min-[60rem]/detail:ring-0",
], {
  variants: {
    interactive: {
      true: [
        "outline-none select-none hover:bg-[color-mix(in_srgb,var(--foreground)_8%,var(--muted))]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "@min-[60rem]/detail:hover:bg-muted @min-[60rem]/detail:aria-expanded:bg-muted",
        // 제출 검사에서 빠진 필수 속성: 오류 색 테두리(넓은 옆 칸에서도 테두리를 되살린다).
        "aria-invalid:ring-destructive aria-invalid:text-destructive @min-[60rem]/detail:aria-invalid:ring-1",
      ],
      false: "",
    },
  },
  defaultVariants: { interactive: true },
})

function PillButton({ isEmpty, className, ...props }: ComponentProps<"button"> & { isEmpty: boolean }) {
  return <button type="button" data-slot="property-pill" data-empty={isEmpty || undefined} className={cn(pillVariants(), className)} {...props} />
}

/** 필수 · 오류 표시. 세 알약이 같이 받는다. */
export type PillCheck = {
  /** 필수 속성: 비었을 때 이름 뒤에 *를 보이고, 읽는 이름에 "(필수)"를 붙인다. */
  isRequired?: boolean
  /**
   * 제출 검사 결과 빠졌다: aria-invalid와 오류 색 테두리. lib/focus-invalid의 focusFirstInvalid가 다른 칸과 함께 화면 순서로 찾는다.
   * 까닭("필수 속성을 정해 주세요: 우선순위")은 알약 곁에 부르는 쪽이 둔다.
   */
  isInvalid?: boolean
}

/**
 * 속성 알약(호호코워크 PropertyPill): 비어 있으면 속성의 아이콘과 이름, 정해지면 그 값. 누르면 정하는 것이 옆에 뜬다
 * (데스크톱 팝오버, 휴대폰 바텀시트). children은 닫기 함수를 받는다. 새 업무 양식과 상세의 속성이 같이 쓴다.
 * 필수(isRequired)는 단추라 aria-required를 받을 수 없어(ARIA에서 button에 허용되지 않는다) 읽는 이름에 "(필수)"를 붙인다.
 */
export function PropertyPill({ label, icon, text, children, width = "w-60", isRequired, isInvalid }: PillCheck & {
  /** 속성 이름: 빈 알약의 글자이자 팝오버 · 시트의 제목. */
  label: string
  /** 비었을 때 속성의 표식, 정해지면 값의 표식. */
  icon: ReactNode
  /** 정해진 값의 글자. 없으면 빈 알약이다. */
  text?: ReactNode
  children: (close: () => void) => ReactNode
  /** 데스크톱 팝오버의 너비 클래스. */
  width?: string
}) {
  const [isOpen, setOpen] = useState(false)
  const isEmpty = text === undefined
  const isMarked = isRequired && isEmpty
  return (
    <AdaptivePopover title={label} open={isOpen} onOpenChange={setOpen} className={cn(width, "p-1.5")}
      trigger={
        <PillButton isEmpty={isEmpty} aria-label={isMarked ? `${label} (필수)` : label} aria-invalid={isInvalid || undefined}>
          {icon}
          <span className="min-w-0 truncate">{isEmpty ? label : text}</span>
          {isMarked && <span aria-hidden className="-ml-1 text-destructive">*</span>}
        </PillButton>
      }>
      {children(() => setOpen(false))}
    </AdaptivePopover>
  )
}

type OptionPillProps<T extends string> = {
  label: string
  /** 비었을 때의 표식. */
  icon: Icon
  options: (Option & { value: T })[]
  /** 비었을 때 이름 대신 보일 말(담당자 없음). */
  emptyText?: string
  /** 정해진 값 앞에 속성 이름을 붙인다(유형: 업무). */
  showLabel?: boolean
} & PillCheck & ({ isMultiple?: false; value?: T; onChange: (value: T) => void } | { isMultiple: true; value: readonly T[]; onChange: (value: T[]) => void })

/** 여러 값의 표식은 조금씩 겹쳐 셋까지. */
function StackedMarks({ options }: { options: Option[] }) {
  return <span className="flex items-center *:not-first:-ml-1">{options.slice(0, 3).map(option => <span key={option.value} className="flex">{option.icon}</span>)}</span>
}

/**
 * 값 목록에서 고르는 알약(호호코워크 OptionPill). 하나를 고르면 닫히고, 여럿(isMultiple)이면 열어 둔 채 고르고 빼며
 * "라벨 2"처럼 첫 값 대신 개수를 보인다. 고를 것이 일곱 개를 넘으면 찾기 칸을 둔다.
 */
export function OptionPill<T extends string>(props: OptionPillProps<T>) {
  const { label, icon: EmptyIcon, options, emptyText, showLabel, isRequired, isInvalid } = props
  const chosen: readonly T[] = props.isMultiple ? props.value : props.value ? [props.value] : []
  const picked = options.filter(option => chosen.includes(option.value))
  const first = picked[0]
  const valueText = !first ? undefined : picked.length === 1 ? first.label : `${label} ${picked.length}`
  const mark = !first ? <EmptyIcon /> : picked.length === 1 ? first.icon : <StackedMarks options={picked} />
  const pick = (value: T, close: () => void) => {
    if (props.isMultiple) props.onChange(toggleValue(props.value, value))
    else {
      props.onChange(value)
      close()
    }
  }
  return (
    <PropertyPill label={first || !emptyText ? label : emptyText} icon={mark} text={showLabel && valueText ? `${label}: ${valueText}` : valueText}
      isRequired={isRequired} isInvalid={isInvalid}>
      {close => (
        <OptionList label={`${label} 고르기`} options={options} chosen={chosen} isSearchable={options.length > 7}
          onPick={value => pick(value as T, close)} />
      )}
    </PropertyPill>
  )
}

/** 날짜 알약(호호코워크 DuePill): 비면 달력 아이콘과 이름, 정하면 포맷한 날짜. 누르면 달력이 뜨고, 날을 고르면 닫힌다. 지우면 비운다. */
export function DatePill({ label, value, format, onChange, isRequired, isInvalid }: PillCheck & {
  label: string
  /** YYYY-MM-DD */
  value?: string
  format: (date: string) => string
  onChange: (value: string | undefined) => void
}) {
  return (
    <PropertyPill label={label} icon={<CalendarIcon />} text={value && format(value)} width="w-auto" isRequired={isRequired} isInvalid={isInvalid}>
      {close => (
        <div className="flex flex-col gap-1.5 p-1.5">
          <DateCalendar value={value} onChange={day => { onChange(day); close() }} />
          {value && (
            <Button variant="ghost" className="justify-start max-md:h-12" onClick={() => { onChange(undefined); close() }}>
              <XIcon data-icon="inline-start" />
              {label} 지우기
            </Button>
          )}
        </div>
      )}
    </PropertyPill>
  )
}
