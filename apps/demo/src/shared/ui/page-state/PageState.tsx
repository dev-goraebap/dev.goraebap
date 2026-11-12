import { useLayoutEffect, useRef, type ReactNode } from "react"
import { cn } from "@/shared/lib/utils"
import { StateLandscape, type StateKind, type StateVariant } from "./StateLandscape"

/** 페이지의 메시지가 창 높이의 어디에서 시작하는지(위 막대가 달라도 같은 자리). */
const ANCHOR = 0.32

/**
 * 보일 것이 없을 때의 화면(호호코워크 PageState): 상태의 풍경 그림 아래 제목 · 설명 · 동작이 살짝 떠오른다.
 * 페이지에서는 메시지가 창 높이의 32%에서 시작해 페이지를 옮겨도 같은 자리이고, 방이 좁으면 그 안에서 가장 낮게.
 * isCompact(패널 · 대화상자)는 방의 위쪽에 둔다. 제목은 그림과 같은 보조 잉크, 설명은 그보다 연하게(글자가 그림보다 진하지 않게).
 */
export function PageState({ kind, title, description, action, variant, illustration, isCompact = false }: {
  kind: StateKind; title: string; description?: string; action?: ReactNode; variant?: StateVariant; illustration?: ReactNode; isCompact?: boolean
}) {
  const room = useRef<HTMLDivElement>(null)
  const group = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const box = room.current
    const content = group.current
    if (isCompact || !box || !content) return undefined
    const place = () => {
      const top = box.getBoundingClientRect().top
      const spare = box.getBoundingClientRect().height - content.getBoundingClientRect().height + (parseFloat(content.style.marginBlockStart) || 0)
      content.style.marginBlockStart = `${Math.round(Math.min(Math.max(window.innerHeight * ANCHOR - top, 0), Math.max(spare, 0)))}px`
    }
    place()
    const observer = new ResizeObserver(place)
    observer.observe(box)
    observer.observe(content)
    window.addEventListener("resize", place)
    return () => { observer.disconnect(); window.removeEventListener("resize", place) }
  }, [isCompact])
  return (
    <div ref={room} data-slot="page-state" className={cn("flex w-full flex-col items-center px-4", !isCompact && "min-h-full flex-1")}>
      <div ref={group} role="status"
        className="flex w-full flex-col items-center gap-1 pt-4 pb-6 text-center motion-safe:animate-[page-state-enter_420ms_cubic-bezier(0.2,0,0,1)_both]">
        <div className="mb-3">{illustration ?? <StateLandscape kind={kind} variant={variant} />}</div>
        <h2 className="text-[1.125rem] font-medium text-icon-muted">{title}</h2>
        {description && <p className="max-w-md text-sm text-state-description">{description}</p>}
        {action && <div className="mt-3 flex items-center gap-2">{action}</div>}
      </div>
    </div>
  )
}
