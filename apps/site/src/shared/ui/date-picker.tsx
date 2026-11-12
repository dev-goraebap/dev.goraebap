import { useState } from "react"
import { ko } from "react-day-picker/locale/ko"
import { cn } from "cn"
import { AdaptivePopover } from "@/shared/ui/adaptive-popover"
import { Button } from "@/shared/ui/button"
import { Calendar } from "@/shared/ui/calendar"
import { CalendarIcon } from "@/shared/ui/icon"

/* 날짜 값은 YYYY-MM-DD 문자열이다. 달력은 그 날의 현지 자정으로 그린다. */
const pad = (value: number) => String(value).padStart(2, "0")
const toDate = (day: string) => new Date(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)))
const toDay = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const fieldText = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" })

/**
 * 한 날을 고르는 달력(shadcn Calendar). 한국어, 주는 일요일에 시작한다(일정 화면과 같다). 휴대폰 바텀시트에서는 칸이 커진다.
 * 고른 날을 다시 눌러도 풀리지 않는다(비우기는 부르는 쪽이 따로 둔다).
 */
export function DateCalendar({ value, onChange, labelledBy, className }: {
  /** YYYY-MM-DD */
  value?: string
  onChange: (value: string) => void
  /** 달력을 이름 짓는 요소의 id(양식 칸의 이름). */
  labelledBy?: string
  className?: string
}) {
  const selected = value ? toDate(value) : undefined
  return (
    <Calendar mode="single" required locale={ko} weekStartsOn={0} selected={selected} defaultMonth={selected} aria-labelledby={labelledBy}
      onSelect={date => onChange(toDay(date))}
      className={cn("mx-auto bg-transparent p-0 max-md:[--cell-size:--spacing(11)]", className)} />
  )
}

/**
 * 양식의 날짜 칸: 입력 칸 모양의 버튼에 고른 날(2026년 11월 12일 (목))을 보이고, 누르면 달력이 뜬다
 * (데스크톱 팝오버, 휴대폰 바텀시트). 날을 고르면 닫힌다.
 */
export function DatePicker({ id, label, value, onChange }: {
  id?: string
  /** 팝오버 · 시트의 제목. */
  label: string
  /** YYYY-MM-DD */
  value?: string
  onChange: (value: string) => void
}) {
  const [isOpen, setOpen] = useState(false)
  return (
    <AdaptivePopover title={label} open={isOpen} onOpenChange={setOpen} className="w-auto p-3"
      trigger={
        <Button id={id} variant="outline" size="lg" data-empty={!value || undefined}
          className="w-full justify-start px-3 font-normal data-empty:text-muted-foreground max-md:h-12 max-md:text-base">
          <CalendarIcon data-icon="inline-start" />
          {value ? fieldText.format(toDate(value)) : "날짜 고르기"}
        </Button>
      }>
      <DateCalendar value={value} onChange={day => { onChange(day); setOpen(false) }} />
    </AdaptivePopover>
  )
}
