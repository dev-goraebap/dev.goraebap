import { dayText, leaveTitle, LeaveStatusBadge, periodText, type LeaveRequest, type SpecialType } from "@/entities/leave"
import { ClockIcon, HomeIcon, StarIcon, UmbrellaIcon } from "@/shared/ui/icon"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/shared/ui/item"

/** 종류 표식: 하루 이상 연차는 우산, 반차 · 반반차는 시계, 병가는 집, 그 밖의 특별휴가는 별. */
const iconOf = (request: LeaveRequest) =>
  request.slot !== "FULL_DAY" ? ClockIcon : request.type === "annual" ? UmbrellaIcon : request.type === "sick" ? HomeIcon : StarIcon

/** 신청 한 줄: 종류 표식, "연차 · 2일"과 기간 · 사유(반려면 반려 사유), 끝에 결재 상태. */
function LeaveRequestItem({ request, types }: { request: LeaveRequest; types: readonly SpecialType[] }) {
  const Icon = iconOf(request)
  const detail = request.status === "rejected" && request.note ? `반려 사유: ${request.note}` : request.reason
  return (
    <Item role="listitem" className="rounded-none max-md:py-3.5">
      <ItemMedia variant="icon"><Icon className="text-icon-muted" /></ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle>{leaveTitle(request, types)} · {dayText(request.days)}</ItemTitle>
        <ItemDescription className="line-clamp-1 tabular-nums">
          {periodText(request.startDate, request.endDate)}{detail && ` · ${detail}`}
        </ItemDescription>
      </ItemContent>
      <ItemActions><LeaveStatusBadge status={request.status} /></ItemActions>
    </Item>
  )
}

/** 내 휴가 신청 목록. 새 것이 위다. types는 특별휴가의 이름을 찾는 데 쓴다. */
export function LeaveRequestList({ requests, types }: { requests: LeaveRequest[]; types: readonly SpecialType[] }) {
  return (
    <ItemGroup aria-label="휴가 신청 내역" className="gap-0 divide-y">
      {requests.map(request => <LeaveRequestItem key={request.id} request={request} types={types} />)}
    </ItemGroup>
  )
}
