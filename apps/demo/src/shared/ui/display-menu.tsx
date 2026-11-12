import { useState, type ReactNode } from "react"
import { AdaptivePopover } from "@/shared/ui/adaptive-popover"
import { Button } from "@/shared/ui/button"
import { SortIcon } from "@/shared/ui/icon"
import { ToolDot } from "@/shared/ui/page"

/**
 * 표시 도구(호호코워크 DisplayMenu): 정렬 · 방향 · 그룹 같은 묶음(DisplayChoice)을 알약 줄로 고르고, 처음과 다르면 초기화.
 * 처음과 다르면 버튼 귀퉁이에 점. 데스크톱은 팝오버, 휴대폰은 바텀시트. 무엇을 고르는지는 페이지가 넘긴다.
 */
export function DisplayMenu({ isTweaked, onReset, children }: { isTweaked: boolean; onReset: () => void; children: ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const isOn = isOpen || isTweaked
  return (
    <AdaptivePopover title="표시" align="end" className="w-80 p-2" open={isOpen} onOpenChange={setOpen}
      trigger={
        <Button variant={isOn ? "view-active" : "tool"} size="icon" aria-label={isTweaked ? "표시, 바뀜" : "표시"} className="relative max-md:size-11">
          <SortIcon chosen={isOn} />
          {isTweaked && <ToolDot label="표시 바뀜" />}
        </Button>
      }>
      <div className="flex flex-col gap-4 p-2">
        {children}
        {isTweaked && (
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" className="rounded-full" onClick={onReset}>초기화</Button>
          </div>
        )}
      </div>
    </AdaptivePopover>
  )
}

/** 표시 묶음 하나: 제목과 알약 줄. 지금 것은 view-active. */
export function DisplayChoice<T extends string>({ title, items, value, onChange }: {
  title: string; items: readonly { value: T; label: string }[]; value: T; onChange: (value: T) => void
}) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
      <div role="group" aria-label={title} className="flex flex-wrap gap-1">
        {items.map(item => (
          <Button key={item.value} variant={item.value === value ? "view-active" : "view"} aria-pressed={item.value === value} className="px-3"
            onClick={() => onChange(item.value)}>
            {item.label}
          </Button>
        ))}
      </div>
    </section>
  )
}
