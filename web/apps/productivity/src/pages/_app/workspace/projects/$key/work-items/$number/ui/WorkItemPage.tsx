import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { workItemHref, workItemOptions, parseWorkItemRef, workspaceWorkItemHref } from '@/entities/work-item';
import { useOpenEditor } from '@/shared/lib/panel';
import { DetailSurface } from '@/shared/ui/kit/detail-surface';
import { PageState } from '@/shared/ui/kit/page-state';
import { pageCrumbs } from '@/shared/ui/nav-icon';
import { WorkItemDetail } from '@/features/work-item-detail';
import type { Crumb } from '@/shared/ui/nav-icon';

/** Where the detail stands: its own page (a link, a reload, 크게 보기), or the dialog a list opened (app's panel host). */
export type DetailSurfaceOptions = { surface?: 'page' | 'dialog'; onClose?: () => void; onExpand?: () => void };

/**
 * A work item on its own page, as client/'s detail page: the list's path with the work item's reference last, and its detail.
 * From 업무 it is /work-items/{KEY-number} (workItemRef), staying in that menu; from a project /projects/{key}/work-items/{number}
 * (projectKey, number). crumbs are the list's; the list's last step becomes the way back. A deleted work item goes back there.
 */
export function WorkItemPage({ crumbs, workItemRef, projectKey, number, surface = 'page', onClose, onExpand }: {
  crumbs: Crumb[]; workItemRef?: string; projectKey?: string; number?: number;
} & DetailSurfaceOptions) {
  const navigate = useNavigate();
  const openEditor = useOpenEditor();
  const found = workItemRef ? parseWorkItemRef(workItemRef) : projectKey && number ? { key: projectKey.toUpperCase(), number } : undefined;
  const isWorkspace = !!workItemRef;
  const listHref = isWorkspace ? '/my-work' : `/workspace/projects/${projectKey}/work-items`;
  const ref = found ? `${found.key}-${found.number}` : '업무';
  // 머리 줄의 이름(스크롤하면 보인다)은 업무의 제목이다. 번호는 그 위 작은 줄(title)이 맡는다: 둘 다 번호면 같은 말이 두 번 선다.
  const name = useQuery({ ...workItemOptions(found?.key ?? '', found?.number ?? 0), enabled: !!found }).data?.issue.title;
  const trail: Crumb[] = [
    ...crumbs.map((crumb, index) => (index === crumbs.length - 1 ? { ...crumb, href: listHref } : crumb)),
    { label: name ?? ref, icon: 'tasks' },
  ];
  // 본문의 도구와 메뉴(…)가 설 머리 줄 오른쪽 자리(페이지 머리 · 대화상자 머리): 상세가 여기에 그려 넣는다.
  const [headSlot, setHeadSlot] = useState<HTMLElement | null>(null);
  return <DetailSurface surface={surface} onClose={onClose} onExpand={onExpand} crumbs={pageCrumbs(trail)} title={ref}
    actions={<div ref={setHeadSlot} className="flex shrink-0 items-center gap-1 empty:hidden" />}>
    {found
      ? <WorkItemDetail key={`${found.key}-${found.number}`} projectKey={found.key} number={found.number} headSlot={headSlot}
        hrefOf={isWorkspace ? workspaceWorkItemHref : workItemHref}
        onEdit={() => openEditor(isWorkspace ? `${workspaceWorkItemHref({ ref: `${found.key}-${found.number}` })}/edit` : `${listHref}/${found.number}/edit`)}
        onDeleted={() => onClose ? onClose() : void navigate({ href: listHref, replace: true })} />
      : <PageState kind="not-found" title="업무를 찾을 수 없습니다" description="주소의 업무 번호(예: COWORK-12)를 확인해 주세요." />}
  </DetailSurface>;
}
