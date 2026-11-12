import type { ComponentProps } from "react"
import { cn } from "cn"
import { GripIcon } from "@/shared/ui/icon"
import type { RowReorder } from "./use-row-reorder"

/**
 * 순서를 바꾸는 줄의 모양. 줄이 손잡이의 가리킴(group/reorder-row)을 알리고, 집어 든 줄은 내용을 숨긴 채 점선 틀로 자리를 비운다.
 * 줄의 다른 모양(높이 · 구분선 · 여백)은 부르는 쪽이 더한다.
 */
export const reorderRowClass = cn(
  "group/reorder-row relative",
  "data-carried:bg-accent data-carried:*:invisible",
  "data-carried:after:pointer-events-none data-carried:after:absolute data-carried:after:inset-1.5 data-carried:after:rounded-lg",
  "data-carried:after:border data-carried:after:border-dashed data-carried:after:border-ring/55 data-carried:after:content-['']",
)

/**
 * 끌기 손잡이(⋮⋮). 평소에는 옅고, 줄을 가리키거나 초점이 오면 보조 잉크, 손잡이를 가리키면 본문 글자색이다.
 * 휴대폰은 44px 높이로 늘 보이게 둔다(가리킴이 없다). 손가락은 손잡이에서만 끌기를 시작한다(touch-none).
 */
export function ReorderGrip({ className, ...props }: ReturnType<RowReorder["gripProps"]> & Omit<ComponentProps<"button">, keyof ReturnType<RowReorder["gripProps"]>>) {
  return (
    <button type="button" {...props}
      className={cn(
        "inline-grid h-7 w-5 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted-foreground/50 outline-none select-none [-webkit-touch-callout:none]",
        "transition-colors group-hover/reorder-row:text-icon-muted hover:bg-accent hover:text-foreground focus-visible:text-icon-muted focus-visible:ring-2 focus-visible:ring-ring",
        "max-md:h-11 max-md:w-7 max-md:text-icon-muted max-md:[&_svg]:size-4.5",
        className,
      )}>
      <GripIcon />
    </button>
  )
}

/**
 * 화면 낭독기에 읽히는 두 줄: 손잡이의 설명(hint)과 방금 일어난 일(said). 목록 곁에 한 번 둔다.
 */
export function ReorderAnnouncer({ reorder }: { reorder: Pick<RowReorder, "hint" | "said"> }) {
  return (
    <>
      <span id={reorder.hint} className="sr-only">손잡이를 끌거나 Alt와 위아래 화살표로 순서를 바꿉니다. Esc로 취소합니다.</span>
      <span role="status" className="sr-only">{reorder.said}</span>
    </>
  )
}
