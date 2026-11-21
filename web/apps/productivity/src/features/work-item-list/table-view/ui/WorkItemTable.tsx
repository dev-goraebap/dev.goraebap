import { Link } from '@tanstack/react-router';
import { cn } from 'cn';
import {
  formatWorkItemDate, WorkItemAssignee, WorkItemPullRequests, WorkItemDueDate, WorkItemLabels, WorkItemPriorityIcon, WorkItemStatusIcon, WorkItemTypeIcon, priorityMark, type WorkItemRow,
} from '@/entities/work-item';
import { WorkItemRowMenu } from '../../ui/WorkItemRowMenu';
import { Checkbox } from '@/shared/ui/kit/checkbox';
import { DetailLink } from '@/shared/ui/kit/detail-surface';
import { ProjectsIcon } from '@/shared/ui/kit/icon';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/kit/table';

/** 줄은 자기 바탕을 칠해 페이지의 점 무늬를 가리고, 가리키면 옅게 덮는다. 제목의 줄 링크가 줄 전체를 덮는다. */
const ROW = 'relative bg-background hover:bg-row-hover';
const HEAD = 'text-muted-foreground';

/**
 * Work items as a desktop table: 번호 · 제목(상태) · 유형 · 프로젝트(across projects) · 담당자 · 우선순위 · 라벨 · 마감 · 바뀐 날,
 * a checkbox per row and a menu at its end. The header stays at the top while the rows go under it; columns that overflow
 * scroll sideways inside the table. Pressing a row opens its work item at hrefOf (the checkbox and menu aside).
 */
export function WorkItemTable({ workItems, selected, showsProject = false, hrefOf, onSelect }: {
  workItems: WorkItemRow[];
  selected: ReadonlySet<string>;
  showsProject?: boolean;
  hrefOf?: (workItem: WorkItemRow) => string;
  onSelect: (ids: ReadonlySet<string>) => void;
}) {
  const isAll = workItems.length > 0 && workItems.every(workItem => selected.has(workItem.id));
  const isSome = selected.size > 0 && !isAll;
  const pick = (id: string, isOn: boolean) => {
    const next = new Set(selected);
    if (isOn) next.add(id);
    else next.delete(id);
    onSelect(next);
  };
  // 업무 표는 제목 열이 남는 폭을 갖는다(Linear처럼 제목이 넓게): 열 폭을 이 표가 정하는 fill.
  return <Table aria-label="업무 표" layout="fill" className="bg-background">
    <TableHeader>
      <TableRow>
        <TableHead className="w-10">
          <Checkbox aria-label="모두 고르기" checked={isAll} indeterminate={isSome}
            onCheckedChange={isOn => onSelect(isOn ? new Set(workItems.map(workItem => workItem.id)) : new Set())} />
        </TableHead>
        <TableHead className={cn('w-26', HEAD)}>번호</TableHead>
        <TableHead className={HEAD}>제목</TableHead>
        <TableHead className={cn('w-21', HEAD)}>유형</TableHead>
        {showsProject ? <TableHead className={cn('w-32', HEAD)}>프로젝트</TableHead> : null}
        <TableHead className={cn('w-32', HEAD)}>담당자</TableHead>
        <TableHead className={cn('w-26', HEAD)}>우선순위</TableHead>
        <TableHead className={cn('w-44', HEAD)}>라벨</TableHead>
        <TableHead className={cn('w-22 text-right', HEAD)}>마감</TableHead>
        <TableHead className={cn('w-22 text-right', HEAD)}>바뀐 날</TableHead>
        <TableHead className="w-12"><span className="sr-only">메뉴</span></TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {workItems.map(workItem => {
        const href = hrefOf?.(workItem);
        return <TableRow key={workItem.id} data-state={selected.has(workItem.id) ? 'selected' : undefined} className={ROW}>
          <TableCell className="h-12.25 compact:h-10.25">
            <Checkbox className="relative z-1" aria-label={`${workItem.ref} ${workItem.title} 고르기`} checked={selected.has(workItem.id)}
              onCheckedChange={isOn => pick(workItem.id, isOn)} />
          </TableCell>
          <TableCell className="max-w-26 truncate text-muted-foreground tabular-nums">{workItem.ref}</TableCell>
          <TableCell className="max-w-0 min-w-48">
            <span className="flex min-w-0 items-center gap-2">
              <WorkItemStatusIcon category={workItem.category} label={workItem.columnName} />
              {href ? <DetailLink href={href} className="min-w-0 flex-1 truncate">{workItem.title}</DetailLink>
                : <span className="min-w-0 flex-1 truncate">{workItem.title}</span>}
              <WorkItemPullRequests counts={workItem.pullRequests} />
            </span>
          </TableCell>
          <TableCell className="max-w-21"><WorkItemTypeIcon type={workItem.type} showsLabel /></TableCell>
          {showsProject ? <TableCell className="max-w-32">
            {workItem.projectName ? <Link to="/workspace/projects/$key/work-items" params={{ key: workItem.projectKey }}
              className="relative z-1 flex min-w-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ProjectsIcon className="size-3.5 shrink-0 text-icon-muted" />
              <span className="truncate">{workItem.projectName}</span>
            </Link> : null}
          </TableCell> : null}
          <TableCell><WorkItemAssignee id={workItem.assigneeId} name={workItem.assigneeName} /></TableCell>
          <TableCell>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <WorkItemPriorityIcon priority={workItem.priority} />
              {priorityMark(workItem.priority).label}
            </span>
          </TableCell>
          <TableCell className="max-w-44"><WorkItemLabels labels={workItem.labels} /></TableCell>
          <TableCell>
            <span className="flex justify-end">
              {workItem.dueDate ? <WorkItemDueDate dueDate={workItem.dueDate} category={workItem.category} /> : <span className="text-xs text-muted-foreground">-</span>}
            </span>
          </TableCell>
          <TableCell className="text-right text-xs text-muted-foreground tabular-nums">{formatWorkItemDate(workItem.updatedAt)}</TableCell>
          <TableCell><span className="flex justify-end"><WorkItemRowMenu workItem={workItem} href={href} /></span></TableCell>
        </TableRow>;
      })}
    </TableBody>
  </Table>;
}
