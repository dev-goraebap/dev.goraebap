import { WorkItemAssignee, WorkItemDueDate, WorkItemLabels, WorkItemPriorityIcon, WorkItemPullRequests, WorkItemTypeIcon, type WorkItemRow } from '@/entities/work-item';
import { WorkItemRowMenu } from '../../ui/WorkItemRowMenu';
import { DetailLink } from '@/shared/ui/kit/detail-surface';

/**
 * A work item on the board (Plane's board card): its reference and type over its title (two lines at most), its labels,
 * then its priority, due date and person. Pressing anywhere on it opens the work item at href (its menu aside).
 */
export function KanbanCard({ workItem, href, showsProject }: { workItem: WorkItemRow; href?: string; showsProject?: boolean }) {
  return <div className="relative flex flex-col gap-2 rounded-lg border bg-card p-3 text-sm shadow-xs hover:bg-row-hover">
    <div className="flex items-center gap-2">
      <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground tabular-nums">
        {showsProject ? `${workItem.projectName} · ${workItem.ref}` : workItem.ref}
      </span>
      <WorkItemPullRequests counts={workItem.pullRequests} />
      <WorkItemTypeIcon type={workItem.type} />
      <WorkItemRowMenu workItem={workItem} href={href} />
    </div>
    {href
      ? <DetailLink href={href} title={`${workItem.ref} ${workItem.title}`} className="line-clamp-2 font-medium">{workItem.title}</DetailLink>
      : <p className="line-clamp-2 font-medium">{workItem.title}</p>}
    {workItem.labels.length > 0 ? <WorkItemLabels labels={workItem.labels} wrap="wrap" /> : null}
    <div className="flex items-center gap-2">
      <WorkItemPriorityIcon priority={workItem.priority} />
      {workItem.dueDate ? <WorkItemDueDate dueDate={workItem.dueDate} category={workItem.category} /> : null}
      <WorkItemAssignee id={workItem.assigneeId} name={workItem.assigneeName} alignsEnd />
    </div>
  </div>;
}
