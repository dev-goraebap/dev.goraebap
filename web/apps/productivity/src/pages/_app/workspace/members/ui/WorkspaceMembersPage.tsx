import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { orgChartOptions, type OrgPerson } from '@/entities/organization';
import { projectMembershipsOptions, projectsOptions, refreshProjects, setProjectRole, type Project, type ProjectRole } from '@/entities/project';
import { useOpenPanel } from '@/shared/lib/panel';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { Page } from '@/shared/ui/kit/layout/page';
import { ListMore } from '@/shared/ui/kit/list-more';
import { PageState } from '@/shared/ui/kit/page-state';
import { SearchTool } from '@/shared/ui/kit/search-tool';
import { toast } from '@/shared/ui/kit/toast';
import { pageCrumbs } from '@/shared/ui/nav-icon';
import { memberHref } from '@/shared/ui/person';
import type { ManageMember, WorkspaceMemberRowData } from '../model/member-row';
import { ParticipationDialog } from './ParticipationDialog';
import { WorkspaceMemberRow } from './WorkspaceMemberRow';
import { WorkspaceMembersTable } from './WorkspaceMembersTable';

type Crumb = { label: string; href?: string; icon?: string };

/**
 * 업무 › 워크스페이스 › 멤버 (Linear의 Members): 업무 공간의 사람들과 저마다 참여한 프로젝트와 그 역할(뷰어 · 에디터 · 관리자).
 * 데스크톱은 표, 휴대폰은 줄 목록이다. 프로젝트에 참여 중인 사람을 앞에, 아직 없는 사람을 뒤에 두고 이름으로 찾는다. 줄을 누르면
 * 그 사람의 프로필, 프로젝트를 누르면 그 업무로 간다. 내가 관리자인 프로젝트(워크스페이스 관리자는 모든 프로젝트)가 있으면 참여 칸
 * 끝의 톱니로 대화상자를 열어 그 프로젝트들을 찾고, 참여시키고 역할을 바꾸고 뺀다(2026-11-15). 역할은 아이콘과 이름으로 보인다. 보이는 참여는 내가 볼 수 있는 프로젝트의 것뿐이다.
 */
export function WorkspaceMembersPage({ crumbs }: { crumbs: Crumb[] }) {
  const openPanel = useOpenPanel();
  const isMobile = useIsMobile();
  const [words, setWords] = useState('');
  const chart = useQuery(orgChartOptions());
  const projects = useQuery(projectsOptions('ACTIVE'));
  const memberships = useQuery(projectMembershipsOptions());
  const client = useQueryClient();
  const managed = (projects.data ?? []).filter(project => project.can.manage);
  const change = useMutation({
    mutationFn: ({ project, userId, role, isIn }: { project: Project; userId: string; role: ProjectRole | null; isIn: boolean }) => setProjectRole(project.key, userId, role, isIn),
    onSuccess: (_, { project, role, isIn }) => toast.add({ title: role === null ? `${project.name}에서 뺐습니다.` : isIn ? `${project.name}의 역할을 바꿨습니다.` : `${project.name}에 추가했습니다.` }),
    onError: (error: Error) => toast.add({ title: error.message }),
    onSettled: () => refreshProjects(client),
  });
  const [managing, setManaging] = useState<OrgPerson | null>(null);
  const onManage: ManageMember | undefined = managed.length > 0 ? setManaging : undefined;
  const open = (id: string) => openPanel(memberHref(id));
  const body = () => {
    const error = chart.error ?? projects.error ?? memberships.error;
    if (error) return <PageState kind="error" title="멤버를 불러오지 못했습니다" description={error.message} />;
    if (!chart.data || !projects.data || !memberships.data) return null;
    const byId = new Map(projects.data.map(project => [project.id, project]));
    const order = new Map(projects.data.map((project, index) => [project.id, index]));
    const projectsOf = (person: OrgPerson) => memberships.data
      .filter(each => each.userId === person.id && byId.has(each.projectId))
      .sort((one, other) => (order.get(one.projectId) ?? 0) - (order.get(other.projectId) ?? 0))
      .map(each => ({ project: byId.get(each.projectId)!, role: each.role }));
    const needle = words.trim().toLowerCase();
    const rows: WorkspaceMemberRowData[] = chart.data.people
      .filter(person => !needle || person.name.toLowerCase().includes(needle) || (person.workEmail ?? '').toLowerCase().includes(needle))
      .map(person => ({ person, projects: projectsOf(person) }))
      .sort((one, other) => Number(other.projects.length > 0) - Number(one.projects.length > 0) || one.person.name.localeCompare(other.person.name, 'ko'));
    if (rows.length === 0) return <PageState kind="search" title="찾는 멤버가 없습니다" />;
    const joined = rows.filter(row => row.projects.length > 0).length;
    const foot = <ListMore shown={rows.length} total={chart.data.people.length} unit="명" meta={`프로젝트 참여 ${joined}명`} hasMore={false} onMore={() => undefined} />;
    if (isMobile) return <>
      <ul aria-label="멤버">{rows.map(row => <WorkspaceMemberRow key={row.person.id} row={row} onOpen={() => open(row.person.id)} onManage={onManage} />)}</ul>
      {foot}
    </>;
    return <><WorkspaceMembersTable rows={rows} onOpen={open} onManage={onManage} />{foot}</>;
  };
  return (
    <Page crumbs={pageCrumbs(crumbs)} tools={<SearchTool label="멤버 검색" placeholder="이름이나 이메일" value={words} onChange={setWords} />}>
      {body()}
      {managing && memberships.data ? <ParticipationDialog name={managing.name} projects={managed} isPending={change.isPending}
        roles={new Map(memberships.data.filter(each => each.userId === managing.id).map(each => [each.projectId, each.role]))}
        onChange={(project, role, isIn) => change.mutate({ project, userId: managing.id, role, isIn })}
        onClose={() => setManaging(null)} /> : null}
    </Page>
  );
}
