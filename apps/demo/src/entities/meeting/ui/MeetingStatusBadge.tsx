import { cn } from "cn"
import { Badge } from "@/shared/ui/badge"
import { statusMark } from "../model/format"
import type { MeetingStatus } from "../model/types"

/** 회의록 상태 알약(호호코워크 Token): 상태 색 점과 이름. */
export function MeetingStatusBadge({ status }: { status: MeetingStatus }) {
  const mark = statusMark(status)
  return (
    <Badge variant="label">
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" className={cn("shrink-0", mark.tone)}>
        <circle cx="8" cy="8" r="5" fill="currentColor" />
      </svg>
      {mark.label}
    </Badge>
  )
}
