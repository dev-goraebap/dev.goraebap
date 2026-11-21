import { parseWorkItemRef, workspaceWorkItemHref } from '@/entities/work-item';
import { useLeaveEditor } from '@/shared/lib/panel';
import { DetailSurface } from '@/shared/ui/kit/detail-surface';
import { PageState } from '@/shared/ui/kit/page-state';
import { pageCrumbs } from '@/shared/ui/nav-icon';
import { WorkItemEditor } from '@/features/work-item-detail';
import type { Crumb } from '@/shared/ui/nav-icon';

/**
 * 업무 수정 화면: 상세의 주소 끝에 /edit를 붙인 자기 주소를 가진다(업무에서 열면 /work-items/{KEY-번호}/edit, 프로젝트에서
 * 열면 /projects/{key}/work-items/{번호}/edit). 머리 줄은 상세로 가는 길과 '수정'이고, 끝나면 상세로 돌아간다.
 */
export function WorkItemEditPage({ crumbs, workItemRef, projectKey, number }: { crumbs: Crumb[]; workItemRef?: string; projectKey?: string; number?: number }) {
  const leave = useLeaveEditor();
  const found = workItemRef ? parseWorkItemRef(workItemRef) : projectKey && number ? { key: projectKey.toUpperCase(), number } : undefined;
  const listHref = workItemRef ? '/my-work' : `/workspace/projects/${projectKey}/work-items`;
  const ref = found ? `${found.key}-${found.number}` : '업무';
  const detailHref = workItemRef ? workspaceWorkItemHref({ ref }) : `${listHref}/${number}`;
  const trail: Crumb[] = [
    ...crumbs.map((crumb, index) => (index === crumbs.length - 1 ? { ...crumb, href: listHref } : crumb)),
    { label: ref, icon: 'tasks', href: detailHref },
    { label: '수정' },
  ];
  return <DetailSurface surface="page" crumbs={pageCrumbs(trail)} title={`${ref} 수정`}>
    {found
      ? <WorkItemEditor key={ref} projectKey={found.key} number={found.number} onLeave={() => leave(detailHref)} />
      : <PageState kind="not-found" title="업무를 찾을 수 없습니다" description="주소의 업무 번호(예: COWORK-12)를 확인해 주세요." />}
  </DetailSurface>;
}
