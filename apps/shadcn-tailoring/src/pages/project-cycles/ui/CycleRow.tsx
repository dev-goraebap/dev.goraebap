import { CycleRing, shortDay, type Cycle, type CycleState } from "@/entities/cycle"
import { WorkItemAssignee, WorkItemPriorityIcon, WorkItemStatusIcon, workItemHref, type WorkItem } from "@/entities/work-item"
import { cn } from "@/shared/lib/utils"
import { ActionMenu, type MenuAction } from "@/shared/ui/action-menu"
import { ChevronRightIcon } from "@/shared/ui/icon"
import { RowLink } from "@/shared/ui/row-link"

export type CycleTotals = { scope: number; done: number; ratio: number }

/** 펼친 사이클 안 업무의 차례: 진행 중 → 할 일 → 백로그 → 완료(손댈 것이 위로). */
const STATUS_ORDER: Record<WorkItem["status"], number> = { in_progress: 0, todo: 1, backlog: 2, done: 3 }

/** 펼친 사이클의 업무 한 줄: 우선순위 · 키 · 상태 · 제목, 데스크톱은 오른쪽에 담당자. 줄 어디를 눌러도 상세로 간다. */
function CycleWorkItem({ item }: { item: WorkItem }) {
  return (
    <li className="relative flex min-h-10 items-center gap-2 border-t px-3 py-2 text-sm hover:bg-row-hover max-md:min-h-12">
      <WorkItemPriorityIcon priority={item.priority} />
      <span className="max-w-20 shrink-0 truncate text-muted-foreground tabular-nums">{item.key}</span>
      <WorkItemStatusIcon status={item.status} />
      <RowLink to={workItemHref(item.key)} className={cn("min-w-0 flex-1 truncate", item.status === "done" && "text-muted-foreground")}>{item.title}</RowLink>
      <WorkItemAssignee person={item.assignee} className="max-md:hidden" />
    </li>
  )
}

/**
 * 사이클 한 줄(호호코워크 CycleRow, 리니어 Cycles). 왼쪽 레일에 경계마다 날짜 하나(각 줄의 시작날을 아래 점 옆에, 맨 위 줄만
 * 끝날을 위에)와 세로선, 가운데 진행 고리 · 이름 · 목표, 오른쪽에 상태 · 완료율 · 범위 · 메뉴. 진행 중인 줄은 바탕을 조금 밝힌다.
 * 호호코워크는 줄을 누르면 업무 목록을 사이클로 걸러 열지만, 여기 업무 목록에는 사이클 필터가 없어 줄 아래에 업무를 펼친다.
 * 휴대폰: 레일이 좁아지고 목표를 빼며, 상태 · 완료율 · 범위는 이름 아래 한 줄로 내린다.
 */
export function CycleRow({ cycle, state, label, totals, items, isFirst, isOpen, onToggle, actions }: {
  cycle: Cycle; state: CycleState; label: string; totals: CycleTotals; items: WorkItem[]
  isFirst: boolean; isOpen: boolean; onToggle: () => void; actions: MenuAction[]
}) {
  const percent = `${Math.round(totals.ratio * 100)}%`
  const sorted = [...items].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
  const isCurrent = state === "current"
  return (
    <li className={cn("relative flex items-stretch bg-background", isCurrent && "bg-linear-to-r from-mark-progress/6 to-mark-progress/6")}>
      <div aria-hidden className={cn(
        "relative flex w-24 shrink-0 flex-col items-end justify-between py-1 pr-6 text-xs leading-none whitespace-nowrap text-muted-foreground tabular-nums max-md:w-21 max-md:pr-4.5",
        // 세로선과, 아래 경계(시작날)의 점.
        "before:absolute before:inset-y-0 before:right-2.5 before:w-px before:bg-border before:content-['']",
        "after:absolute after:right-1.75 after:-bottom-1 after:z-1 after:size-1.75 after:rounded-full after:border after:border-muted-foreground/50 after:bg-background after:content-['']",
      )}>
        <span className="opacity-70">{isFirst ? shortDay(cycle.endDate) : ""}</span>
        <span className="translate-y-1.5">{shortDay(cycle.startDate)}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-h-13 items-center gap-2 pr-3 hover:bg-row-hover max-md:min-h-16">
          <button type="button" aria-expanded={isOpen} onClick={onToggle}
            className="flex min-w-0 flex-1 items-center gap-2 self-stretch px-1 text-left text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset md:px-2">
            <ChevronRightIcon className={cn("size-3.5 shrink-0 text-icon-muted transition-transform motion-reduce:transition-none", isOpen && "rotate-90")} />
            <CycleRing ratio={totals.ratio} state={state} />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5 md:flex-row md:items-center md:gap-3">
              <span className="max-w-full shrink-0 truncate font-medium md:max-w-1/2">{cycle.name}</span>
              {cycle.goal && <span className="min-w-0 flex-1 truncate text-muted-foreground max-md:hidden">{cycle.goal}</span>}
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums md:hidden">
                <span className={cn(isCurrent && "text-foreground")}>{label}</span>
                <span aria-hidden>·</span>
                <span>{percent} 완료</span>
                <span aria-hidden>·</span>
                <span>범위 {totals.scope}</span>
              </span>
            </span>
          </button>
          <span className="flex shrink-0 items-center gap-4 text-xs tabular-nums max-md:hidden">
            <span className={cn("min-w-16 text-right", isCurrent ? "text-foreground" : "text-muted-foreground")}>{label}</span>
            <span className="flex w-26 items-center justify-end gap-1.5">
              <CycleRing ratio={totals.ratio} state={state} />
              <span>{percent}</span>
              <span className="text-muted-foreground">완료</span>
            </span>
            <span className="w-14 text-right">{totals.scope}<span className="text-muted-foreground"> 범위</span></span>
          </span>
          <ActionMenu label={`${cycle.name} 메뉴`} title={cycle.name} size="row" actions={actions} />
        </div>
        {isOpen && (
          sorted.length > 0 ? (
            <ul aria-label={`${cycle.name} 업무`} className="mb-2 flex flex-col">
              {sorted.map(item => <CycleWorkItem key={item.key} item={item} />)}
            </ul>
          ) : (
            <p className="mb-2 border-t px-3 py-3 text-sm text-muted-foreground">담긴 업무가 없습니다.</p>
          )
        )}
      </div>
    </li>
  )
}
