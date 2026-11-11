import { dayText, halfDayMark, LeaveStatusBadge, leaveTypeMark, periodText, type LeaveRequest } from "@/entities/leave"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/shared/ui/item"

/** 신청 한 줄: 종류 표식, "연차 · 2일"과 기간 · 사유(반려면 반려 사유), 끝에 결재 상태. */
function LeaveRequestItem({ request }: { request: LeaveRequest }) {
  const type = leaveTypeMark(request.type)
  const name = request.half ? halfDayMark(request.half).label : type.label
  const detail = request.status === "rejected" && request.note ? `반려 사유: ${request.note}` : request.reason
  return (
    <Item role="listitem" className="rounded-none max-md:py-3.5">
      <ItemMedia variant="icon"><type.icon className="text-icon-muted" /></ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle>{name} · {dayText(request.days)}</ItemTitle>
        <ItemDescription className="line-clamp-1 tabular-nums">
          {periodText(request.startDate, request.endDate)}{detail && ` · ${detail}`}
        </ItemDescription>
      </ItemContent>
      <ItemActions><LeaveStatusBadge status={request.status} /></ItemActions>
    </Item>
  )
}

/** 내 휴가 신청 목록. 새 것이 위다. */
export function LeaveRequestList({ requests }: { requests: LeaveRequest[] }) {
  return (
    <ItemGroup aria-label="휴가 신청 내역" className="gap-0 divide-y">
      {requests.map(request => <LeaveRequestItem key={request.id} request={request} />)}
    </ItemGroup>
  )
}
