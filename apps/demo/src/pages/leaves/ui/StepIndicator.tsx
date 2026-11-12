import { Fragment } from "react"
import { cn } from "@/shared/lib/utils"
import { CheckIcon } from "@/shared/ui/icon"

/**
 * 단계 표시(호호코워크 Stepper density="compact"): 번호 원과 이름을 가는 선으로 잇는다. 지난 단계는 강조색 원에 체크이고
 * 눌러 돌아갈 수 있으며, 지금 단계는 강조색 테두리, 남은 단계는 흐리다.
 */
export function StepIndicator({ steps, current, onStep }: { steps: readonly string[]; current: number; onStep: (index: number) => void }) {
  return (
    <ol aria-label="휴가 신청 단계" className="flex items-center gap-2">
      {steps.map((label, index) => {
        const isDone = index < current
        const isCurrent = index === current
        return (
          <Fragment key={label}>
            {index > 0 && <li aria-hidden className={cn("h-px min-w-4 flex-1", isDone || isCurrent ? "bg-primary" : "bg-border")} />}
            <li aria-current={isCurrent ? "step" : undefined} className="flex shrink-0">
              <button type="button" disabled={!isDone} onClick={() => onStep(index)}
                className="flex items-center gap-2 rounded-md text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default">
                <span className={cn(
                  "grid size-6 place-items-center rounded-full text-xs font-semibold tabular-nums [&_svg]:size-3.5",
                  isDone ? "bg-primary text-primary-foreground" : isCurrent ? "text-primary ring-2 ring-primary ring-inset" : "bg-muted text-muted-foreground",
                )}>
                  {isDone ? <CheckIcon /> : index + 1}
                </span>
                <span className={cn("font-medium", isCurrent ? "text-foreground" : "text-muted-foreground", isDone && "hover:text-foreground")}>{label}</span>
              </button>
            </li>
          </Fragment>
        )
      })}
    </ol>
  )
}
