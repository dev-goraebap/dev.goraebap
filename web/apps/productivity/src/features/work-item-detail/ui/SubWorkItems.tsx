import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { createWorkItem, WorkItemAssignee, WorkItemPriorityIcon, WorkItemStatusIcon, refreshWorkItems, type WorkItemRow } from '@/entities/work-item';
import { Input } from '@/shared/ui/kit/input';
import { RowLink } from '@/shared/ui/kit/row-link';
import { Spinner } from '@/shared/ui/kit/spinner';

/**
 * The work item's sub-items (BIT's hierarchy): each with its status, reference, title, priority and assignee, opened at
 * hrefOf; who may change the work item adds one by its title, which starts in the project's first 할 일 column.
 */
export function SubWorkItems({ workItem, items, canEdit, hrefOf }: {
  workItem: WorkItemRow; items: readonly WorkItemRow[]; canEdit: boolean; hrefOf: (child: WorkItemRow) => string;
}) {
  const client = useQueryClient();
  const [title, setTitle] = useState('');
  const create = useMutation({
    mutationFn: (text: string) => createWorkItem(workItem.projectKey, { title: text, type: 'TASK', priority: 'NONE', parentId: workItem.id, labelIds: [] }),
    onSuccess: () => setTitle(''),
    onSettled: () => refreshWorkItems(client),
  });
  const add = () => {
    const text = title.trim();
    if (text && !create.isPending) create.mutate(text);
  };
  if (!canEdit && items.length === 0) return null;
  return <section aria-label="하위 업무" className="flex flex-col gap-2">
    <h2 className="text-xs font-medium text-muted-foreground">{items.length ? `하위 업무 ${items.length}` : '하위 업무'}</h2>
    {items.length > 0 ? <ul className="flex flex-col divide-y divide-border">
      {items.map(child => <li key={child.id} className="relative flex min-h-9 items-center gap-2 rounded-md px-1.5 hover:bg-row-hover max-md:min-h-12">
        <WorkItemStatusIcon category={child.category} label={child.columnName} />
        <span className="shrink-0 text-sm text-muted-foreground tabular-nums">{child.ref}</span>
        <RowLink to={hrefOf(child)} className="min-w-0 flex-1 truncate text-sm">{child.title}</RowLink>
        <WorkItemPriorityIcon priority={child.priority} />
        <WorkItemAssignee id={child.assigneeId} name={child.assigneeName} />
      </li>)}
    </ul> : null}
    {canEdit ? <div className="flex flex-col gap-1">
      <div className="relative flex items-center">
        <Input aria-label="하위 업무 추가" placeholder="하위 업무 제목을 적고 Enter" value={title} aria-invalid={!!create.error || undefined}
          className="h-8 max-md:h-11" onChange={event => setTitle(event.target.value.slice(0, 200))}
          onKeyDown={event => { if (event.key === 'Enter' && !event.nativeEvent.isComposing) { event.preventDefault(); add(); } }} />
        {create.isPending ? <Spinner aria-label="하위 업무를 만드는 중" className="absolute end-2.5" /> : null}
      </div>
      {create.error ? <p role="alert" className="text-sm text-destructive">{create.error.message}</p> : null}
    </div> : null}
  </section>;
}
