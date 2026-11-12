import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import type { Icon } from "@/shared/ui/icon"

export type PageView<T extends string> = { value: T; label: string; icon?: Icon }

/**
 * 뷰 · 탭 알약 줄. 지금 뷰는 한 단계 진한 바탕과 Bold Duotone 아이콘이다. compact면(휴대폰에서 자리가 좁을 때) 아이콘만 둔다.
 */
export function PageViews<T extends string>({ views, value, onChange, label, isCompact }: {
  views: PageView<T>[]; value: T; onChange: (value: T) => void; label: string; isCompact?: boolean
}) {
  return (
    <div role="tablist" aria-label={label} className="flex items-center gap-1.5">
      {views.map(view => {
        const isCurrent = view.value === value
        return (
          <Button key={view.value} role="tab" aria-selected={isCurrent} aria-label={isCompact ? view.label : undefined}
            variant={isCurrent ? "view-active" : "view"} size={isCompact ? "icon" : "default"} onClick={() => onChange(view.value)}
            className={cn("max-md:h-11 max-md:[&_svg]:size-6", isCompact ? "max-md:w-11" : "px-3 max-md:px-4")}>
            {view.icon && <view.icon chosen={isCurrent} data-icon="inline-start" />}
            {!isCompact && view.label}
          </Button>
        )
      })}
    </div>
  )
}
