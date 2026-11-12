import type { ComponentProps, ReactElement } from "react"
import { cn } from "cn"
import { Button } from "@/shared/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"

/**
 * 서식 막대 · 선택 서식 도구의 단추. 데스크톱 28px(넓은 단추는 글자와 ▼), 휴대폰 44px. 켜진 서식은 aria-pressed로 한 단계
 * 진한 바탕이다. 이름은 툴팁으로 보인다(단축키가 있으면 함께).
 */
const TOOL = "text-icon-muted hover:text-foreground aria-expanded:text-foreground aria-pressed:bg-pressed aria-pressed:text-foreground max-md:size-11"

/**
 * 툴팁을 단 단추. 메뉴의 여는 단추로도 쓴다: 메뉴가 넘기는 속성(ref · 누르기 · aria-*)을 그대로 단추에 잇는다.
 */
export function Tip({ label, children, ...props }: { label: string; children: ReactElement } & Record<string, unknown>) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} {...props} />
      <TooltipContent className="max-md:hidden">{label}</TooltipContent>
    </Tooltip>
  )
}

export function ToolButton({ label, tip, isWide = false, className, ...props }: ComponentProps<typeof Button> & {
  /** 읽기용 이름. tip이 없으면 툴팁도 이 이름이다. */
  label: string
  tip?: string
  /** 아이콘만이 아니라 글자 · ▼가 함께 있는 단추. */
  isWide?: boolean
}) {
  return (
    <Tip label={tip ?? label}>
      <Button variant="ghost" size={isWide ? "sm" : "icon-sm"} aria-label={label}
        className={cn(TOOL, isWide && "gap-1 px-2 text-foreground max-md:w-auto max-md:px-3", className)} {...props} />
    </Tip>
  )
}

/** 도구 묶음 사이의 가는 세로줄. */
export const ToolDivider = () => <span aria-hidden className="mx-1 inline-block h-4.5 w-px shrink-0 bg-border" />
