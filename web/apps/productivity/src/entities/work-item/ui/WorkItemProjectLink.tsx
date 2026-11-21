import { Link } from '@tanstack/react-router';
import { cn } from 'cn';
import { ProjectsIcon } from '@/shared/ui/kit/icon';
import type { WorkItemRow } from '../model/types';

/** 프로젝트 이름: 그 프로젝트의 업무 목록으로 가는 작은 링크. 줄 링크 위에 떠서 따로 눌린다. */
export function WorkItemProjectLink({ workItem, className }: { workItem: WorkItemRow; className?: string }) {
  return <Link to="/workspace/projects/$key/work-items" params={{ key: workItem.projectKey }}
    className={cn('relative z-1 flex min-w-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground', className)}>
    <ProjectsIcon className="size-3.5 shrink-0 text-icon-muted" />
    <span className="truncate">{workItem.projectName}</span>
  </Link>;
}
