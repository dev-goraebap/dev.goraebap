import { cn } from "cn"
import type { CycleState } from "../model/types"

const RADIUS = 6
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/** 진행 중은 업무의 진행 중 색, 마침은 완료 색, 나머지는 보조 잉크. */
const FILL: Record<CycleState, string> = {
  current: "stroke-mark-progress", completed: "stroke-mark-done", ended: "stroke-muted-foreground", upcoming: "stroke-muted-foreground",
}

/** 사이클이 얼마나 끝났는지 보이는 16px 고리(호호코워크 Ring): 비어 있음 · 일부 · 전체. */
export function CycleRing({ ratio, state, className }: { ratio: number; state: CycleState; className?: string }) {
  const filled = CIRCUMFERENCE * Math.min(1, Math.max(0, ratio))
  return (
    <svg viewBox="0 0 16 16" aria-hidden focusable="false" className={cn("size-4 shrink-0", className)}>
      <circle cx="8" cy="8" r={RADIUS} fill="none" strokeWidth="2" className="stroke-border" />
      {filled > 0 && (
        <circle cx="8" cy="8" r={RADIUS} fill="none" strokeWidth="2" strokeLinecap="round" transform="rotate(-90 8 8)"
          strokeDasharray={`${filled} ${CIRCUMFERENCE}`} className={FILL[state]} />
      )}
    </svg>
  )
}
