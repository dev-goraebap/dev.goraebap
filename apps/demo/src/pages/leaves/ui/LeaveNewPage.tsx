import { useSearch } from "@tanstack/react-router"
import { formatDays, useLeaveSummary } from "@/entities/leave"
import { paths } from "@/shared/config"
import { Card } from "@/shared/ui/card"
import { ChevronRightIcon, StarIcon, UmbrellaIcon, type Icon } from "@/shared/ui/icon"
import { RowLink } from "@/shared/ui/row-link"
import { parseNewRequestSearch, type RequestKind } from "../model/new-request"
import { LeaveRequestForm } from "./LeaveRequestForm"
import { RequestFrame } from "./RequestFrame"

const CHOICES: { kind: RequestKind; icon: Icon; title: string; description: string }[] = [
  { kind: "annual", icon: UmbrellaIcon, title: "연차 신청", description: "하루 이상, 반차, 반반차 연차를 신청합니다." },
  { kind: "special", icon: StarIcon, title: "그 외 휴가", description: "포상 · 대체 · 병가 · 경조 같은 특별휴가를 신청합니다." },
]

/** 무엇을 신청할지(호호코워크 RequestChooser). 연차 줄에는 지금 신청할 수 있는 일수를 붙인다. 고르면 그 양식의 주소로 간다. */
function RequestChooser() {
  const summary = useLeaveSummary()
  return (
    <section aria-labelledby="request-choice" className="flex flex-col gap-2">
      <h2 id="request-choice" className="text-sm font-medium text-muted-foreground">무엇을 신청할까요</h2>
      <Card className="gap-0 divide-y py-0">
        {CHOICES.map(choice => (
          <div key={choice.kind} className="relative flex min-h-16 items-center gap-3 px-3 py-3 hover:bg-row-hover">
            <choice.icon className="size-5 shrink-0 text-icon-muted" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <RowLink to={`${paths.leaves}/new`} search={{ kind: choice.kind } as never} className="font-medium">{choice.title}</RowLink>
              <p className="text-sm text-muted-foreground">
                {choice.description}
                {choice.kind === "annual" && summary.data && ` 지금 ${formatDays(summary.data.available)}일 신청할 수 있습니다.`}
              </p>
            </div>
            <ChevronRightIcon className="size-4 shrink-0 text-icon-muted" />
          </div>
        ))}
      </Card>
    </section>
  )
}

/**
 * 새 신청(/leaves/new, 호호코워크 NewRequestPage · RequestComposer). 종류가 없으면 고르기, ?kind=annual · special이면 그 양식.
 * ?type=(특별휴가 종류) · ?date=(첫날)로 양식을 그 자리에서 연다. 종류가 주소에 있어 뒤로 가기가 고르기로 돌아간다.
 */
export function LeaveNewPage() {
  const search = parseNewRequestSearch(useSearch({ strict: false }) as Record<string, unknown>)
  if (!search.kind) return <RequestFrame title="신청하기"><RequestChooser /></RequestFrame>
  return <LeaveRequestForm key={`${search.kind}-${search.type ?? ""}-${search.date ?? ""}`} mode={search.kind} initialTypeId={search.type} initialDate={search.date} />
}
