import { TriangleAlertIcon } from '@/shared/ui/kit/icon';
import { formatWorkItemDate, isLate } from '../model/date';
import type { ColumnCategory } from '../model/types';
import { isClosing } from '../model/words';

/**
 * A work item's due date as its rows read it (11월 3일, prefix 마감 when given), an alert in the error colour before it once
 * it has passed on an open work item.
 */
export function WorkItemDueDate({ dueDate, category, prefix }: { dueDate: string; category: ColumnCategory; prefix?: string }) {
  const late = isLate(dueDate, isClosing(category));
  return <span className="flex shrink-0 items-center gap-1 text-xs whitespace-nowrap text-muted-foreground tabular-nums">
    {late ? <TriangleAlertIcon role="img" aria-hidden={false} aria-label="마감 지남" className="size-3.5 shrink-0 text-destructive" /> : null}
    {prefix ? `${prefix} ${formatWorkItemDate(dueDate)}` : formatWorkItemDate(dueDate)}
  </span>;
}
