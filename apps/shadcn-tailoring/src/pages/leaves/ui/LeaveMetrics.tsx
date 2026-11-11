import type { ReactNode } from "react"
import { cn } from "@/shared/lib/utils"

export type Metric = { label: string; value: ReactNode; note?: ReactNode }

/**
 * 숫자 칸 줄(호호코워크 LeaveMetrics): 위아래 선 사이에 칸을 나란히, 칸 사이는 세로 선. 첫 칸이 가장 중요해 크게 쓴다.
 * 휴대폰은 첫 칸이 한 줄을 다 쓰고 나머지는 두 칸씩.
 */
export function LeaveMetrics({ label, items }: { label: string; items: Metric[] }) {
  return (
    <dl aria-label={label}
      className="grid grid-cols-2 border-y md:auto-cols-fr md:grid-flow-col md:grid-cols-none">
      {items.map((item, index) => (
        <div key={item.label}
          className={cn("flex min-w-0 flex-col justify-end gap-1 p-3 first:pl-0 md:not-first:border-l",
            "max-md:first:col-span-2 max-md:not-first:border-t max-md:odd:not-first:border-l max-md:even:pl-0")}>
          <dt className="text-xs text-muted-foreground">{item.label}</dt>
          <dd className={index === 0 ? "text-[1.75rem] leading-tight font-semibold tabular-nums" : "font-semibold tabular-nums"}>
            {item.value}
            {item.note && <small className="block text-xs font-normal text-muted-foreground">{item.note}</small>}
          </dd>
        </div>
      ))}
    </dl>
  )
}
