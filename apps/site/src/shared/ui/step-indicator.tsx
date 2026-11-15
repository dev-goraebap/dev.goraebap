import { Fragment } from "react"
import { cn } from "cn"
import { CheckIcon } from "@/shared/ui/icon"

/**
 * 양식의 단계: 번호 동그라미와 이름을 가는 선으로 잇는다.
 * 지난 단계는 채운 동그라미에 체크이고 눌러 돌아갈 수 있다. 지금 단계는 테를 두르고, 앞 단계는 조용하다.
 * 단계를 넘으면 잇는 선이 왼쪽부터 채워지고, 동그라미의 색이 부드럽게 바뀌며, 체크가 커지며 나타난다.
 */
export function StepIndicator({ label, steps, current, onStep, isDisabled = false }: {
  label: string
  steps: readonly string[]
  current: number
  /** 지난 단계를 눌렀을 때(돌아가기). */
  onStep: (index: number) => void
  isDisabled?: boolean
}) {
  return (
    <ol aria-label={label} className="flex items-center gap-2">
      {steps.map((name, index) => {
        const isDone = index < current
        const isCurrent = index === current
        return (
          <Fragment key={name}>
            {index > 0 && (
              // 잇는 선: 이 단계에 닿으면 왼쪽부터 채워진다.
              <li aria-hidden className="relative h-px min-w-4 flex-1 overflow-hidden bg-border">
                <span className={cn("absolute inset-0 origin-left bg-primary transition-transform duration-300 ease-out motion-reduce:transition-none",
                  isDone || isCurrent ? "scale-x-100" : "scale-x-0")} />
              </li>
            )}
            <li aria-current={isCurrent ? "step" : undefined} className="flex shrink-0">
              <button type="button" disabled={!isDone || isDisabled} onClick={() => onStep(index)}
                className="flex items-center gap-2 rounded-md text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default">
                <span className={cn(
                  "grid size-6 place-items-center rounded-full text-xs font-semibold tabular-nums transition-[background-color,color,box-shadow] duration-300 motion-reduce:transition-none [&_svg]:size-3.5",
                  isDone ? "bg-primary text-primary-foreground" : isCurrent ? "text-primary ring-2 ring-primary ring-inset" : "bg-muted text-muted-foreground",
                )}>
                  {isDone ? <CheckIcon key="done" className="animate-in fade-in-0 zoom-in-50 duration-200" /> : index + 1}
                </span>
                <span className={cn("font-medium transition-colors duration-300", isCurrent ? "text-foreground" : "text-muted-foreground", isDone && "hover:text-foreground")}>{name}</span>
              </button>
            </li>
          </Fragment>
        )
      })}
    </ol>
  )
}
