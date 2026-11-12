import { useNavigate, useSearch } from "@tanstack/react-router"
import { currentMonth, monthTitle, shiftMonth } from "@/entities/leave"
import { paths } from "@/shared/config"
import { Button } from "@/shared/ui/button"
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon, UmbrellaIcon } from "@/shared/ui/icon"
import { Page, PageViews, type PageView } from "@/shared/ui/page"
import { leavesSearch, NEW_LEAVE_PATH, parseLeavesSearch, type LeavesSearch, type LeavesTab } from "../model/search"
import { LeaveTab } from "./LeaveTab"
import { OvertimeTab } from "./OvertimeTab"

const TABS: PageView<LeavesTab>[] = [
  { value: "leave", label: "휴가", icon: UmbrellaIcon },
  { value: "overtime", label: "연장근무", icon: ClockIcon },
]

/** 달 넘기기: 이전 달 · 달 이름 · 다음 달, 이번 달이 아니면 이번 달로. */
function MonthSwitcher({ month, onChange }: { month: string; onChange: (month: string) => void }) {
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" aria-label="이전 달" onClick={() => onChange(shiftMonth(month, -1))}><ChevronLeftIcon /></Button>
      <span className="font-semibold tabular-nums">{monthTitle(month)}</span>
      <Button variant="ghost" size="icon" aria-label="다음 달" onClick={() => onChange(shiftMonth(month, 1))}><ChevronRightIcon /></Button>
      {month !== currentMonth() && <Button variant="view" className="px-3" onClick={() => onChange(currentMonth())}>이번 달</Button>}
    </div>
  )
}

/**
 * 근태 · 휴가(호호코워크 LeavesPage): 내 휴가와 한 달의 연장근무를 탭으로 나누고, 탭과 달은 주소에 둔다.
 * 신청하기는 새 신청(/leaves/new)을 연다. 내용은 설정 페이지처럼 가운데 한 열(최대 720px)이다.
 */
export function LeavesPage() {
  const navigate = useNavigate()
  const search = parseLeavesSearch(useSearch({ strict: false }) as Record<string, unknown>)
  const go = (next: LeavesSearch, replace = false) => void navigate({ to: paths.leaves, search: leavesSearch(next) as never, replace })
  return (
    <Page crumbs={[{ label: "근태 · 휴가", icon: ClockIcon }]}
      views={<PageViews label="근태 · 휴가 탭" views={TABS} value={search.tab} onChange={tab => go({ ...search, tab })} />}
      create={{ label: "신청하기", onClick: () => void navigate({ to: NEW_LEAVE_PATH }) }}>
      <div className="flex justify-center px-4 py-8 max-md:pb-24">
        <div className="flex w-full max-w-180 min-w-0 flex-col gap-8">
          {search.tab === "leave" ? <LeaveTab /> : (
            <>
              <MonthSwitcher month={search.month} onChange={month => go({ ...search, month }, true)} />
              <OvertimeTab month={search.month} />
            </>
          )}
        </div>
      </div>
    </Page>
  )
}
