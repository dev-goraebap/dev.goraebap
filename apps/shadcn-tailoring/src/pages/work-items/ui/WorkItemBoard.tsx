import {
  typeMark, WorkflowColumnIcon, WorkItemAssignee, WorkItemLabels, WorkItemPriorityIcon, type WorkflowColumn, type WorkItem, type WorkItemStatus,
} from "@/entities/work-item"
import { Button } from "@/shared/ui/button"
import { PlusIcon } from "@/shared/ui/icon"
import { columnIdOf } from "../model/filters"
import { WorkItemLink } from "./WorkItemLink"
import { WorkItemMenu } from "./WorkItemMenu"

/** 보드 카드(호호코워크 KanbanCard): 키 · 유형 · 메뉴, 제목, 라벨, 아래에 우선순위와 담당자. 누르면 상세로 간다. */
function BoardCard({ item }: { item: WorkItem }) {
  const type = typeMark(item.type)
  return (
    <li className="relative flex flex-col gap-2 rounded-lg border bg-card p-3 text-sm shadow-xs">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground tabular-nums">{item.key}</span>
        <type.icon role="img" aria-hidden={false} aria-label={type.label} className="shrink-0 text-icon-muted" />
        <WorkItemMenu item={item} />
      </div>
      <WorkItemLink itemKey={item.key} className="line-clamp-3">{item.title}</WorkItemLink>
      <WorkItemLabels labels={item.labels} className="flex-wrap" />
      <div className="flex items-center justify-between gap-2 pt-1">
        <WorkItemPriorityIcon priority={item.priority} />
        <WorkItemAssignee person={item.assignee} />
      </div>
    </li>
  )
}

/**
 * 보드 뷰: 프로젝트 워크플로의 칸마다 한 줄, 칸 안에서 카드가 세로로 넘어간다. 업무가 없는 칸도 그린다(그 칸의 +로 만든다).
 * 가로 넘김은 본문 안에서만. 휴대폰은 칸 하나 폭(304px)씩 옆으로 넘기며 칸에 맞춰 멈춘다.
 */
export function WorkItemBoard({ items, columns, onCreateIn }: {
  items: WorkItem[]; columns: readonly WorkflowColumn[]; onCreateIn?: (status: WorkItemStatus) => void
}) {
  return (
    <div className="flex min-h-0 flex-1 snap-x snap-mandatory gap-3 overflow-x-auto p-3 max-md:scroll-px-3 md:snap-none">
      {columns.map(column => {
        const cards = items.filter(item => columnIdOf(columns, item) === column.id)
        return (
          <section key={column.id} aria-label={column.name}
            className="flex w-76 shrink-0 snap-start flex-col rounded-xl bg-band md:w-72">
            <header className="flex h-11 shrink-0 items-center gap-2 pr-1.5 pl-3 text-sm font-medium md:h-10">
              <WorkflowColumnIcon column={column} />
              <span className="truncate">{column.name}</span>
              <span className="font-normal text-muted-foreground tabular-nums">{cards.length}</span>
              {onCreateIn && (
                <Button variant="ghost" size="icon-xs" aria-label={`${column.name}에 업무 만들기`} className="ml-auto max-md:size-9"
                  onClick={() => onCreateIn(column.id)}>
                  <PlusIcon />
                </Button>
              )}
            </header>
            <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
              {cards.map(item => <BoardCard key={item.id} item={item} />)}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
