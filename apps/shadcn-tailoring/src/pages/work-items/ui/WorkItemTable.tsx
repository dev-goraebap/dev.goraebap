import {
  formatWorkItemDate, priorityMark, WorkItemAssignee, WorkItemLabels, WorkItemPriorityIcon, WorkItemStatusIcon, WorkItemTypeLabel, type WorkItem,
} from "@/entities/work-item"
import { Checkbox } from "@/shared/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { WorkItemLink } from "./WorkItemLink"
import { WorkItemMenu } from "./WorkItemMenu"
import { ROW_SURFACE } from "./WorkItemRow"

/**
 * 표 뷰(호호코워크 WorkItemTable): 고르기 · 번호 · 제목(상태) · 유형 · 담당자 · 우선순위 · 라벨 · 마감 · 바뀐 날 · 메뉴.
 * 머리 줄은 위에 붙고, 칸이 넘치면 표 안에서 가로로 넘긴다. 첫 · 끝 칸은 면 가장자리에서 16px.
 */
export function WorkItemTable({ items, selected, onSelectedChange }: {
  items: WorkItem[]; selected: Set<string>; onSelectedChange: (selected: Set<string>) => void
}) {
  const isAll = items.length > 0 && items.every(item => selected.has(item.id))
  const pick = (id: string, isOn: boolean) => {
    const next = new Set(selected)
    if (isOn) next.add(id)
    else next.delete(id)
    onSelectedChange(next)
  }
  return (
    <Table className="bg-background">
      <TableHeader className="sticky top-0 z-10 bg-background">
        <TableRow className="hover:bg-transparent">
          <TableHead className="h-11 w-10 pl-4">
            <Checkbox aria-label="모두 고르기" checked={isAll} indeterminate={!isAll && selected.size > 0}
              onCheckedChange={isOn => onSelectedChange(isOn ? new Set(items.map(item => item.id)) : new Set())} />
          </TableHead>
          <TableHead className="w-26 text-muted-foreground">번호</TableHead>
          <TableHead className="text-muted-foreground">제목</TableHead>
          <TableHead className="text-muted-foreground">유형</TableHead>
          <TableHead className="text-muted-foreground">담당자</TableHead>
          <TableHead className="text-muted-foreground">우선순위</TableHead>
          <TableHead className="text-muted-foreground">라벨</TableHead>
          <TableHead className="text-right text-muted-foreground">마감</TableHead>
          <TableHead className="text-right text-muted-foreground">바뀐 날</TableHead>
          <TableHead className="w-10 pr-4"><span className="sr-only">메뉴</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map(item => (
          <TableRow key={item.id} data-state={selected.has(item.id) ? "selected" : undefined} className={ROW_SURFACE}>
            <TableCell className="h-12.25 pl-4 compact:h-10.25">
              <Checkbox className="relative z-1" aria-label={`${item.key} 고르기`} checked={selected.has(item.id)} onCheckedChange={isOn => pick(item.id, isOn)} />
            </TableCell>
            <TableCell className="max-w-26 truncate text-muted-foreground tabular-nums">{item.key}</TableCell>
            <TableCell className="max-w-64">
              <span className="flex min-w-0 items-center gap-2">
                <WorkItemStatusIcon status={item.status} />
                <WorkItemLink itemKey={item.key} className="truncate">{item.title}</WorkItemLink>
              </span>
            </TableCell>
            <TableCell><WorkItemTypeLabel type={item.type} /></TableCell>
            <TableCell><WorkItemAssignee person={item.assignee} /></TableCell>
            <TableCell>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <WorkItemPriorityIcon priority={item.priority} />
                {priorityMark(item.priority).label}
              </span>
            </TableCell>
            <TableCell><WorkItemLabels labels={item.labels} /></TableCell>
            <TableCell className="text-right text-xs text-muted-foreground tabular-nums">{item.dueDate ? formatWorkItemDate(item.dueDate) : "-"}</TableCell>
            <TableCell className="text-right text-xs text-muted-foreground tabular-nums">{formatWorkItemDate(item.updatedAt)}</TableCell>
            <TableCell className="pr-4"><WorkItemMenu item={item} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
