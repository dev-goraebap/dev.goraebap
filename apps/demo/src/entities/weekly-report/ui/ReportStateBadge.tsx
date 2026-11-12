import { cn } from "cn"
import { Badge } from "@/shared/ui/badge"
import { reportState } from "../model/states"
import type { ReportState } from "../model/types"

/** 보고 상태 알약(호호코워크 Token): 색 점과 이름. */
export function ReportStateBadge({ state }: { state: ReportState }) {
  const mark = reportState(state)
  return (
    <Badge variant="label">
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", mark.dot)} />
      {mark.label}
    </Badge>
  )
}
