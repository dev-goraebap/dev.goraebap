import { cn } from 'cn';
import { DetailLink } from '@/shared/ui/kit/detail-surface';
import type { WorkItemRow } from '../model/types';

/** 제목: 상세를 여는 줄 링크(줄 어디를 눌러도 열린다), 부모가 목록 밖이면 그 아래에 누구의 하위 업무인지. */
export function WorkItemTitleCell({ workItem, href, parentLabel, className }: { workItem: WorkItemRow; href?: string; parentLabel?: string; className?: string }) {
  const title = href
    ? <DetailLink href={href} className="truncate">{workItem.title}</DetailLink>
    : <span className="truncate">{workItem.title}</span>;
  if (!parentLabel) return <span className={cn('flex min-w-0', className)}>{title}</span>;
  return <span className={cn('flex min-w-0 flex-col', className)}>
    {title}
    <span className="truncate text-xs text-muted-foreground">{parentLabel}</span>
  </span>;
}
