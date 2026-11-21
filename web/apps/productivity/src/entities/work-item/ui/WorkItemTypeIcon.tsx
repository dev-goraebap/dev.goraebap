import { cn } from 'cn';
import { MarkIcon, markTone } from '@/shared/ui/mark-picker';
import { useWorkItemTypes } from '../api/types';
import type { WorkItemType } from '../model/types';

/**
 * A work item's type as its 16px mark icon in the type's own colour (a mark the workspace keeps, 프로젝트 관리 › 업무 유형),
 * named for a screen reader; a plain checklist while the types are read. showsLabel puts the type's name beside it.
 */
export function WorkItemTypeIcon({ type, showsLabel = false, className }: { type: WorkItemType; showsLabel?: boolean; className?: string }) {
  const found = useWorkItemTypes().typeOf(type);
  const name = found?.name ?? '업무';
  // check-ui: allow-style 유형의 색은 관리자가 고른 데이터다.
  const icon = <MarkIcon name={found?.icon ?? 'checklist'} style={markTone(found?.color)} role="img" aria-hidden={showsLabel} aria-label={name}
    className={cn('size-4 shrink-0', found?.color ? 'text-(--mark)' : 'text-icon-muted', !showsLabel && className)} />;
  if (!showsLabel) return icon;
  return <span className={cn('flex min-w-0 shrink-0 items-center gap-1 text-xs text-muted-foreground', className)}>
    {icon}
    <span className="truncate">{name}</span>
  </span>;
}
