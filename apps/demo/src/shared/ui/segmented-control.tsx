import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group"
import type { CSSProperties } from "react"
import { cn } from "cn"

export type SegmentedOption<T extends string> = { value: T; label: string }

/**
 * 몇 개 중 하나를 고르는 조작(호호코워크 SegmentedControl): 둥근 홈 하나에 같은 폭의 칸이 서고, 고른 칸 아래에
 * 올린 면이 미끄러져 온다. 고른 칸을 다시 눌러도 풀리지 않는다. 휴대폰은 칸이 44px로 커진다.
 * Base UI ToggleGroup 위에 짓는다(화살표 키로 칸을 옮기고 Space · Enter로 고른다).
 */
export function SegmentedControl<T extends string>({ label, options, value, onChange, className }: {
  /** 화면 읽기용 이름. */
  label: string
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}) {
  const index = Math.max(0, options.findIndex(option => option.value === value))
  return (
    <ToggleGroupPrimitive
      data-slot="segmented-control"
      aria-label={label}
      value={[value]}
      onValueChange={([next]) => next && onChange(next as T)}
      // check-ui: allow-style 칸 수와 고른 칸의 차례: 미끄러지는 면의 폭과 자리가 이 값으로 정해진다.
      style={{ "--count": options.length, "--index": index } as CSSProperties}
      className={cn("relative inline-grid min-w-0 auto-cols-fr grid-flow-col rounded-lg bg-muted p-0.5", className)}
    >
      <span
        aria-hidden
        className="absolute inset-y-0.5 left-0.5 w-[calc((100%-0.25rem)/var(--count))] translate-x-[calc(100%*var(--index))] rounded-md bg-background shadow-xs ring-1 ring-border transition-transform duration-200 ease-out motion-reduce:transition-none"
      />
      {options.map(option => (
        <TogglePrimitive
          key={option.value}
          value={option.value}
          className="relative h-7 min-w-0 truncate rounded-md px-3 text-sm font-medium text-muted-foreground outline-none select-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 data-pressed:text-foreground max-md:h-10"
        >
          {option.label}
        </TogglePrimitive>
      ))}
    </ToggleGroupPrimitive>
  )
}
