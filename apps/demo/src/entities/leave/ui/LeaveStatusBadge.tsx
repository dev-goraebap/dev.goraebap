import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { leaveStatusMark } from "../model/text"
import type { LeaveStatus } from "../model/types"

/** 결재 상태 알약(호호코워크 Token): 상태 색 점과 이름. 휴가 신청과 연장근무가 같이 쓴다. */
export function LeaveStatusBadge({ status }: { status: LeaveStatus }) {
  const mark = leaveStatusMark(status)
  return (
    <Badge variant="label">
      <span aria-hidden className={cn("size-1.5 rounded-full", mark.tone)} />
      {mark.label}
    </Badge>
  )
}
