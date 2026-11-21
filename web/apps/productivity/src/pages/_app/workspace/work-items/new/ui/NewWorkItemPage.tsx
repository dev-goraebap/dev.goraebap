import { useLocation, useNavigate } from '@tanstack/react-router';
import { workItemHref, workspaceWorkItemHref } from '@/entities/work-item';
import { pageCrumbs } from '@/shared/ui/nav-icon';
import { NewWorkItem } from '@/pages/_app/workspace/work-items/new';
import type { Crumb } from '@/shared/ui/nav-icon';

/**
 * 새 업무 on its own page (/workspace/work-items/new, ?project= the project chosen first, ?column= the status it starts at): where a
 * link, a reload or 크게 보기 opens it, and a phone always (a desktop opens it as a dialog over the list, app's panel
 * host). Made, the new work item's page takes its place; 취소 goes back to the list. The list's last step becomes the way
 * back to it, then 새 업무.
 */
export function NewWorkItemPage({ crumbs, projectKey }: { crumbs: Crumb[]; projectKey?: string }) {
  const navigate = useNavigate();
  const column = new URLSearchParams(useLocation({ select: location => location.searchStr })).get('column') ?? undefined;
  const list = projectKey ? `/workspace/projects/${projectKey}/work-items` : '/my-work';
  const trail: Crumb[] = [...crumbs.map((crumb, index) => (index === crumbs.length - 1 ? { ...crumb, href: list } : crumb)), { label: '새 업무' }];
  return <NewWorkItem projectKey={projectKey} columnId={column} surface="page" crumbs={pageCrumbs(trail)}
    onClose={() => void navigate({ href: list })}
    onCreated={created => void navigate({ replace: true, href: projectKey
      ? workItemHref({ projectKey: created.key, number: created.number }) : workspaceWorkItemHref({ ref: `${created.key}-${created.number}` }) })} />;
}
