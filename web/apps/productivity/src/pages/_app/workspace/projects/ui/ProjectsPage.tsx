import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState, type Ref } from 'react';
import {
  changeProject, orderProjects, projectMembershipsOptions, projectsOptions, refreshProjects, useIsWorkspaceAdmin, type Project, type ProjectChange, type ProjectStatus,
} from '@/entities/project';
import { workingPeopleOptions } from '@/entities/work-item';
import { useAddressChoices, useAddressWords } from '@/shared/lib/list-address';
import { rowReorderStyles as rows, useRowReorder } from '@/shared/lib/row-reorder';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { cn } from 'cn';
import { Alert, AlertTitle } from '@/shared/ui/kit/alert';
import { Button } from '@/shared/ui/kit/button';
import { ArchiveIcon, GripIcon, ProjectsIcon, TriangleAlertIcon } from '@/shared/ui/kit/icon';
import { Page, PageViews, type PageView } from '@/shared/ui/kit/layout/page';
import { ListMore } from '@/shared/ui/kit/list-more';
import { PageState } from '@/shared/ui/kit/page-state';
import { RowLink } from '@/shared/ui/kit/row-link';
import { SearchTool } from '@/shared/ui/kit/search-tool';
import { SortableHead } from '@/shared/ui/kit/sortable-head';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableText } from '@/shared/ui/kit/table';
import { Mark } from '@/shared/ui/mark-picker';
import { pageCrumbs } from '@/shared/ui/nav-icon';
import { CreateProjectDialog } from './CreateProjectDialog';
import { ProjectChangeDialog } from './ProjectChangeDialog';
import { INITIAL_PROJECT_DISPLAY, ProjectDisplayMenu, type ProjectDisplay } from './ProjectDisplayMenu';
import { ProjectMemberFaces } from './ProjectMemberFaces';
import { ProjectRowMenu } from './ProjectRowMenu';

type Crumb = { label: string; href?: string; icon?: string };

/** A description's first line, as a row shows it. */
const firstLine = (text?: string | null) => text?.split('\n').find(line => line.trim())?.trim() ?? '';

const day = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'short', day: 'numeric' });

const TABS: PageView<ProjectStatus>[] = [
  { value: 'ACTIVE', label: '진행 중', icon: ProjectsIcon }, { value: 'ARCHIVED', label: '보관함', icon: ArchiveIcon },
];

/**
 * 프로젝트 (client/'s ProjectsPage, BIT's 모든 프로젝트): the company's projects in rows under tabs, 진행 중 in the
 * administrators' order and 보관함 by name, and 삭제됨 for Workspace administrators. Each row shows the project's name,
 * key and the description's first line and its members (three faces, then 외 N명; pressing lists them all); it opens the
 * project's work items (a deleted one opens nothing). Workspace administrators also have 새 프로젝트 and
 * each row's … (설정, 보관 or 보관 해제, 삭제 with the key typed, 되살리기 in 삭제됨). The words, the filter and the
 * display are kept in the address (?q, ?favorite, ?sort, ?direction), as before.
 */
export function ProjectsPage({ crumbs }: { crumbs: Crumb[] }) {
  const client = useQueryClient();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isAdmin = useIsWorkspaceAdmin();
  const [tab, setTab] = useState<ProjectStatus>('ACTIVE');
  const status: ProjectStatus = tab === 'ARCHIVED' ? 'ARCHIVED' : 'ACTIVE';
  const [q, setQ] = useAddressWords();
  const [display, setDisplay] = useAddressChoices<ProjectDisplay>(INITIAL_PROJECT_DISPLAY, { sort: ['custom', 'name', 'members'], direction: ['asc', 'desc'] });
  const [failure, setFailure] = useState<string>();
  const projects = useQuery(projectsOptions(status));
  // 표의 멤버 칸(Linear 팀 표의 Members): 누가 어느 프로젝트에 속하는지와 사람의 이름.
  const memberships = useQuery({ ...projectMembershipsOptions(), enabled: !isMobile });
  const people = useQuery({ ...workingPeopleOptions(), enabled: !isMobile });
  const reorder = useRowReorder((projects.data ?? []).map(p => ({ id: p.id, name: p.name })), { word: '프로젝트', object: '프로젝트를', topic: '프로젝트는' }, rows.ghost,
    async ids => { setFailure(undefined); await orderProjects(ids); await refreshProjects(client); }, error => setFailure(error instanceof Error ? error.message : '순서를 저장하지 못했습니다.'));
  const canReorder = isAdmin && status === 'ACTIVE' && display.sort === 'custom' && !q.trim();
  const [isCreating, setCreating] = useState(false);
  const [asking, setAsking] = useState<{ project: Project; change: ProjectChange } | null>(null);
  const change = useMutation({
    mutationFn: ({ project, change: next }: { project: Project; change: ProjectChange }) => changeProject(project, next),
    onSuccess: () => setAsking(null),
    onSettled: () => refreshProjects(client),
  });
  const openNew = isAdmin ? () => setCreating(true) : undefined;
  const ask = (project: Project, next: ProjectChange) => { change.reset(); setAsking({ project, change: next }); };
  const body = () => {
    if (projects.isError) return <PageState kind="error" title="프로젝트를 불러오지 못했습니다" description={projects.error.message} />;
    if (!projects.data) return null;
    if (projects.data.length === 0) return status === 'ARCHIVED'
      ? <PageState kind="empty" title="보관한 프로젝트가 없습니다" />
      // 프로젝트는 그 멤버에게만 보인다: 아무것도 없으면 아직 참여한 프로젝트가 없는 것이다(워크스페이스 관리자는 모두 본다).
      : <PageState kind="empty" title={openNew ? '아직 프로젝트가 없습니다' : '참여한 프로젝트가 없습니다'}
          action={openNew ? <Button variant="create" onClick={openNew}>새 프로젝트</Button> : undefined} />;
    const byId = new Map(projects.data.map(p => [p.id, p]));
    const visible = reorder.order.map(id => byId.get(id)).filter((p): p is Project => !!p)
      .filter(p => `${p.name} ${p.key} ${p.description ?? ''}`.toLocaleLowerCase().includes(q.trim().toLocaleLowerCase()));
    if (display.sort !== 'custom') visible.sort((a, b) => (display.sort === 'members' ? a.memberCount - b.memberCount : a.name.localeCompare(b.name, 'ko')) * (display.direction === 'asc' ? 1 : -1));
    if (!visible.length) return <PageState kind="search" title="조건에 맞는 프로젝트가 없습니다" />;
    const menu = (project: Project) => (isAdmin ? <ProjectRowMenu project={project} status={status} onChange={next => ask(project, next)} /> : null);
    // 휴대폰은 줄 목록(표가 좁아 들어가지 않는다).
    if (isMobile) return (
      <div ref={reorder.list} role="list" aria-label="프로젝트" className={cn(rows.list, 'border-b')}>
        {visible.map(project => {
          const description = firstLine(project.description);
          return (
            <div key={project.id} role="listitem" {...reorder.rowProps(project.id)}
              className={cn(rows.row, 'flex items-center gap-3 bg-background px-4 py-3 hover:bg-row-hover')}>
              <Mark icon={project.icon} color={project.color} letter={project.key} size="md" />
              <span className="flex min-w-0 flex-1 flex-col">
                <RowLink to="/workspace/projects/$key" params={{ key: project.key }} className="truncate font-medium">{project.name}</RowLink>
                <span className="truncate text-xs text-muted-foreground">
                  <span className="tabular-nums">{project.key}</span>{description ? ` · ${description}` : ''}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1">{menu(project)}</span>
            </div>
          );
        })}
      </div>
    );
    // 데스크톱은 표(Linear의 팀 표, 2026-11-14): 이름(표식 · 이름 · 키) · 설명 · 멤버 · 만든 날 · 수정일 · ….
    const names = new Map((people.data ?? []).map(person => [person.id, person.name]));
    // 머리 칸으로 정렬한다(이름은 가나다부터, 멤버는 많은 쪽부터). 같은 칸을 세 번째 누르면 관리자가 정한 순서로 돌아간다.
    const FIRST: Record<'name' | 'members', 'asc' | 'desc'> = { name: 'asc', members: 'desc' };
    const sortBy = (sort: 'name' | 'members', direction: 'asc' | 'desc') => setDisplay(
      display.sort === sort && display.direction !== FIRST[sort] ? INITIAL_PROJECT_DISPLAY : { sort, direction });
    const sortHead = (label: string, key: 'name' | 'members', className: string) => (
      <SortableHead label={label} sortKey={key} sort={display.sort === 'custom' ? ('' as 'name') : display.sort} direction={display.direction}
        firstDirection={FIRST[key]} onSort={sortBy} className={className} />
    );
    const membersOf = (project: Project) => (memberships.data ?? []).filter(each => each.projectId === project.id && names.has(each.userId))
      .map(each => ({ id: each.userId, name: names.get(each.userId)! }));
    return (
      <Table aria-label="프로젝트" className="bg-background">
        <TableHeader>
          <TableRow>
            {canReorder ? <TableHead className="w-8 pl-3"><span className="sr-only">순서</span></TableHead> : null}
            {sortHead('이름', 'name', cn(!canReorder && 'pl-4'))}
            <TableHead>설명</TableHead>
            {sortHead('멤버', 'members', 'w-32')}
            <TableHead className="w-28">만든 날</TableHead>
            <TableHead className="w-28">수정일</TableHead>
            <TableHead className="w-10"><span className="sr-only">관리</span></TableHead>
          </TableRow>
        </TableHeader>
        {/* 끌어 순서 바꾸기는 목록 안의 [data-row]를 찾으므로 표 몸체(tbody)에도 그대로 건다. */}
        <TableBody ref={reorder.list as unknown as Ref<HTMLTableSectionElement>}>
          {visible.map(project => {
            const members = membersOf(project);
            return (
              <TableRow key={project.id} {...reorder.rowProps(project.id)} className={cn(rows.row, 'relative bg-background hover:bg-row-hover')}>
                {canReorder ? (
                  <TableCell className="pl-3">
                    <button type="button" className={cn(rows.grip, 'relative z-1')} {...reorder.gripProps({ id: project.id, name: project.name })}>
                      <GripIcon />
                    </button>
                  </TableCell>
                ) : null}
                <TableCell className={cn(!canReorder && 'pl-4')}>
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Mark icon={project.icon} color={project.color} letter={project.key} size="sm" />
                    <RowLink to="/workspace/projects/$key" params={{ key: project.key }} className="truncate font-medium">{project.name}</RowLink>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{project.key}</span>
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground"><TableText>{firstLine(project.description) || ''}</TableText></TableCell>
                <TableCell><ProjectMemberFaces project={project} people={members} /></TableCell>
                <TableCell className="text-muted-foreground tabular-nums">{day.format(new Date(project.createdAt))}</TableCell>
                <TableCell className="text-muted-foreground tabular-nums">{day.format(new Date(project.updatedAt))}</TableCell>
                <TableCell>
                  <span className="flex items-center justify-end gap-1">{menu(project)}</span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };
  const created = (key: string) => { setCreating(false); void navigate({ href: `/workspace/projects/${key}/work-items` }); };
  // A phone's 새 프로젝트 is a full-screen page in the list's place (ComposeSurface draws it as one).
  if (isCreating && isMobile) return <CreateProjectDialog onClose={() => setCreating(false)} onCreated={created} />;
  return (
    <Page crumbs={pageCrumbs(crumbs)}
      create={openNew ? { label: '새 프로젝트', onClick: openNew } : undefined}
      views={<PageViews label="프로젝트 탭" views={TABS} value={status} onChange={setTab} isCompact={isMobile} />}
      tools={<>
        <SearchTool label="프로젝트 검색" placeholder="이름 · 키로 찾기" value={q} onChange={setQ} />
        {/* 데스크톱 표는 머리 칸으로 정렬한다. 휴대폰 줄 목록만 정렬 메뉴를 둔다. */}
        {isMobile ? <ProjectDisplayMenu value={display} onChange={setDisplay} /> : null}
      </>}
      >
      {failure ? (
        <Alert className="m-3 w-auto">
          <TriangleAlertIcon />
          <AlertTitle>{failure}</AlertTitle>
        </Alert>
      ) : null}
      <p id={reorder.hint} className={rows.spoken}>손잡이를 끌거나 Alt와 위아래 화살표로 순서를 바꿉니다.</p>
      <p className={rows.spoken} role="status" aria-live="polite">{reorder.said}</p>
      {body()}
      {projects.data?.length ? <ListMore shown={projects.data.length} total={projects.data.length} unit="개" hasMore={false} onMore={() => undefined} /> : null}
      {asking ? <ProjectChangeDialog project={asking.project} change={asking.change} isPending={change.isPending} error={change.error}
        onClose={() => setAsking(null)} onConfirm={() => change.mutate(asking)} /> : null}
      {isCreating ? <CreateProjectDialog onClose={() => setCreating(false)} onCreated={created} /> : null}
    </Page>
  );
}
