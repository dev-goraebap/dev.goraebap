import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { useState } from 'react';
import { workingPeopleOptions } from '@/entities/work-item';
import {
  ProjectRoleLabel, ProjectRoleSelect, projectMembersOptions, projectOptions, refreshProjects, setProjectRole, type ProjectMember, type ProjectRole,
} from '@/entities/project';
import { useOpenPanel } from '@/shared/lib/panel';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { ActionMenu } from '@/shared/ui/kit/action-menu';
import { Button } from '@/shared/ui/kit/button';
import { ConfirmDialog } from '@/shared/ui/kit/confirm-dialog';
import { LogoutIcon } from '@/shared/ui/kit/icon';
import { ListMore } from '@/shared/ui/kit/list-more';
import { Page } from '@/shared/ui/kit/layout/page';
import { PageState } from '@/shared/ui/kit/page-state';
import { memberHref, PersonAvatar } from '@/shared/ui/person';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/kit/table';
import { toast } from '@/shared/ui/kit/toast';
import { pageCrumbs } from '@/shared/ui/nav-icon';
import { AddMemberDialog } from './AddMemberDialog';

type Crumb = { label: string; href?: string; icon?: string };
/** What the project's administrators do with a row: change the role, take the member out. */
type RowActions = { onRole: (role: ProjectRole) => void; onRemove: () => void };

const day = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'short', day: 'numeric' });

/** 이름 칸: 사진과 이름. 이름 단추가 줄 전체를 덮어(::after) 어디를 눌러도 프로필이 열린다(워크스페이스 멤버 표와 같다). */
function Name({ member, onOpen }: { member: ProjectMember; onOpen: () => void }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <PersonAvatar id={member.userId} name={member.name} size={20} isStatic />
      <button type="button" aria-label={`${member.name} 프로필 열기`} onClick={onOpen}
        className="truncate font-medium outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring">
        {member.name}
      </button>
    </span>
  );
}

/** 역할 칸: 관리자에게는 고르는 것, 그 밖에는 아이콘과 이름. */
function Role({ member, actions }: { member: ProjectMember; actions?: RowActions }) {
  return actions
    ? <span className="relative z-1 inline-flex"><ProjectRoleSelect label={`${member.name}의 역할`} value={member.role} onChange={role => { if (role) actions.onRole(role); }} /></span>
    : <ProjectRoleLabel role={member.role} className="text-sm" />;
}

/** 줄 끝 더보기(…): 프로젝트에서 빼기. 관리자에게만 있다. */
function More({ member, actions }: { member: ProjectMember; actions?: RowActions }) {
  if (!actions) return null;
  return (
    <span className="relative z-1 flex justify-end">
      <ActionMenu label={`${member.name} 더보기`} title={member.name} size="row"
        actions={[{ label: '프로젝트에서 빼기', icon: LogoutIcon, onSelect: actions.onRemove }]} />
    </span>
  );
}

/**
 * A project's 멤버 (프로젝트 설정 › 멤버): who is in it with which role (cowork-projects 권한), in the order they
 * joined. Laid out as the area's 멤버 table (2026-11-15): 이름 · 역할 · 참여한 날, and for the project's
 * administrators (and Workspace administrators) a role to choose in the row and 프로젝트에서 빼기 under its more (…) menu;
 * a phone shows rows. They add a working member with a role (멤버 추가), an archived project's too; the last administrator
 * stays. Everyone else reads. A row opens the member's profile. The project's key is the address's ($key).
 */
export function ProjectMembersPage({ crumbs }: { crumbs: Crumb[] }) {
  const { key = '' } = useParams({ strict: false }) as { key?: string };
  const client = useQueryClient();
  const openPanel = useOpenPanel();
  const isMobile = useIsMobile();
  const project = useQuery(projectOptions(key));
  const canChange = !!project.data?.can.manage;
  const members = useQuery(projectMembersOptions(key));
  const people = useQuery({ ...workingPeopleOptions(), enabled: canChange });
  const [isAdding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<ProjectMember | null>(null);
  const set = useMutation({
    mutationFn: ({ userId, role, isIn }: { userId: string; role: ProjectRole | null; isIn: boolean }) => setProjectRole(project.data?.key ?? key, userId, role, isIn),
    onSettled: () => refreshProjects(client),
  });
  const inside = new Set(members.data?.map(member => member.userId));
  const outside = (people.data ?? []).filter(person => !inside.has(person.id));
  const openAdd = canChange ? () => { set.reset(); setAdding(true); } : undefined;
  const actionsOf = (member: ProjectMember): RowActions | undefined => (canChange ? {
    onRole: role => { if (role !== member.role) set.mutate({ userId: member.userId, role, isIn: true }, { onError: error => toast.add({ title: error.message }) }); },
    onRemove: () => { set.reset(); setRemoving(member); },
  } : undefined);
  const open = (member: ProjectMember) => openPanel(memberHref(member.userId));
  const body = () => {
    const error = project.error ?? members.error;
    if (error) return <PageState kind="error" title="멤버를 불러오지 못했습니다" description={error.message} />;
    if (!members.data) return null;
    if (members.data.length === 0) return <PageState kind="empty" title="아직 멤버가 없습니다"
      action={openAdd ? <Button variant="secondary" onClick={openAdd}>멤버 추가</Button> : undefined} />;
    // 휴대폰은 줄 목록(표가 좁아 들어가지 않는다): 사진 · 이름, 끝에 역할과 더보기.
    if (isMobile) return (
      <ul aria-label="프로젝트 멤버">
        {members.data.map(member => (
          <li key={member.userId} className="relative flex min-h-16 items-center gap-3 border-b bg-background px-4 py-2">
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <Name member={member} onOpen={() => open(member)} />
            </span>
            <Role member={member} actions={actionsOf(member)} />
            <More member={member} actions={actionsOf(member)} />
          </li>
        ))}
      </ul>
    );
    return (
      <Table aria-label="프로젝트 멤버" className="bg-background">
        <TableHeader>
          <TableRow>
            <TableHead>이름</TableHead>
            <TableHead>역할</TableHead>
            <TableHead>참여한 날</TableHead>
            {canChange ? <TableHead><span className="sr-only">더보기</span></TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.data.map(member => (
            <TableRow key={member.userId} className="relative">
              <TableCell><Name member={member} onOpen={() => open(member)} /></TableCell>
              <TableCell><Role member={member} actions={actionsOf(member)} /></TableCell>
              <TableCell className="text-muted-foreground tabular-nums">{day.format(new Date(member.joinedAt))}</TableCell>
              {canChange ? <TableCell><More member={member} actions={actionsOf(member)} /></TableCell> : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };
  return (
    <Page crumbs={pageCrumbs(crumbs)} create={openAdd ? { label: '멤버 추가', onClick: openAdd } : undefined}>
      {body()}
      {members.data?.length ? <ListMore shown={members.data.length} total={members.data.length} unit="명" meta={`관리자 ${members.data.filter(member => member.role === 'ADMIN').length}명`} hasMore={false} onMore={() => undefined} /> : null}
      {isAdding ? <AddMemberDialog people={outside} isLoading={people.isPending} isPending={set.isPending} error={set.error}
        onClose={() => setAdding(false)}
        onAdd={(userId, role) => set.mutate({ userId, role, isIn: false }, { onSuccess: () => setAdding(false) })} /> : null}
      <ConfirmDialog open={!!removing} onOpenChange={open => { if (!open && !set.isPending) setRemoving(null); }}
        title={`${removing?.name ?? ''}님을 프로젝트에서 뺄까요?`}
        description={set.error?.message ?? '빠지면 이 프로젝트와 그 안의 업무 · 문서를 더 볼 수 없습니다.'}
        action={{ label: '빼기', isPending: set.isPending,
          onAction: () => { if (removing) set.mutate({ userId: removing.userId, role: null, isIn: true }, { onSuccess: () => setRemoving(null) }); } }} />
    </Page>
  );
}
