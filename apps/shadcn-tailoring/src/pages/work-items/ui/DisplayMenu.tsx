import { useState, type ReactNode } from "react"
import { AdaptivePopover } from "@/shared/ui/adaptive-popover"
import { Button } from "@/shared/ui/button"
import { SortIcon } from "@/shared/ui/icon"
import { DIRECTIONS, GROUPS, INITIAL_DISPLAY, SORTS, type Display } from "../model/filters"
import { ToolDot } from "./FilterMenu"

/** 고를 것 한 줄: 뷰 알약과 같은 모양, 지금 것은 view-active. */
function Pills<T extends string>({ label, items, value, onChange }: {
  label: string; items: readonly { value: T; label: string }[]; value: T; onChange: (value: T) => void
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1">
      {items.map(item => (
        <Button key={item.value} variant={item.value === value ? "view-active" : "view"} aria-pressed={item.value === value} className="px-3"
          onClick={() => onChange(item.value)}>
          {item.label}
        </Button>
      ))}
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
      {children}
    </section>
  )
}

/**
 * 표시 도구(호호코워크 DisplayMenu): 정렬 기준, 기준에 맞는 말로 쓴 방향, 그룹을 알약 줄로 고르고 초기화한다.
 * 처음과 다르면 버튼 귀퉁이에 점. 데스크톱은 팝오버, 휴대폰은 바텀시트.
 */
export function DisplayMenu({ value, onChange }: { value: Display; onChange: (value: Display) => void }) {
  const [isOpen, setOpen] = useState(false)
  const isTweaked = value.sort !== INITIAL_DISPLAY.sort || value.direction !== INITIAL_DISPLAY.direction || value.group !== INITIAL_DISPLAY.group
  const isOn = isOpen || isTweaked
  const [desc, asc] = DIRECTIONS[SORTS.find(sort => sort.value === value.sort)?.kind ?? "date"]
  return (
    <AdaptivePopover title="표시" align="end" className="w-80 p-2" open={isOpen} onOpenChange={setOpen}
      trigger={
        <Button variant={isOn ? "view-active" : "tool"} size="icon" aria-label={isTweaked ? "표시, 바뀜" : "표시"} className="relative max-md:size-11">
          <SortIcon chosen={isOn} />
          {isTweaked && <ToolDot label="표시 바뀜" />}
        </Button>
      }>
      <div className="flex flex-col gap-4 p-2">
        <Section title="정렬 기준"><Pills label="정렬 기준" items={SORTS} value={value.sort} onChange={sort => onChange({ ...value, sort })} /></Section>
        <Section title="방향">
          <Pills label="방향" items={[{ value: "desc", label: desc }, { value: "asc", label: asc }] as const} value={value.direction}
            onChange={direction => onChange({ ...value, direction })} />
        </Section>
        <Section title="그룹"><Pills label="그룹" items={GROUPS} value={value.group} onChange={group => onChange({ ...value, group })} /></Section>
        {isTweaked && (
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" className="rounded-full" onClick={() => onChange(INITIAL_DISPLAY)}>초기화</Button>
          </div>
        )}
      </div>
    </AdaptivePopover>
  )
}
