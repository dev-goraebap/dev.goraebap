import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { documentsOptions } from '@/entities/document';
import { ProjectRoleLabel, projectMembersOptions, projectOptions, type Project } from '@/entities/project';
import { boardGroupsOptions, cyclesOptions, workItemHref, WorkItemListRow, workItemsOptions } from '@/entities/work-item';
import { ApiError } from '@/shared/api';
import { cn } from 'cn';
import { Button } from '@/shared/ui/kit/button';
import { ArchiveIcon, CalendarIcon, FileTextIcon, NotesIcon, RepeatIcon, SettingsIcon } from '@/shared/ui/kit/icon';
import { Page } from '@/shared/ui/kit/layout/page';
import { PageState } from '@/shared/ui/kit/page-state';
import { Mark } from '@/shared/ui/mark-picker';
import { pageCrumbs } from '@/shared/ui/nav-icon';
import { PersonAvatar } from '@/shared/ui/person';
import { MarkdownRead } from '@/shared/ui/rich-body';
import { ProjectCurrentCycleCard } from './ProjectCurrentCycleCard';
import { ProjectOverviewFact } from './ProjectOverviewFact';
import { ProjectOverviewSection } from './ProjectOverviewSection';
import { ProjectProgressCard } from './ProjectProgressCard';

type Crumb = { label: string; href?: string; icon?: string };

const day = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric' });
const shortDay = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' });
/** 개요에 보이는 최근 업무 · 문서의 수. */
const RECENT = 5;
/** 겹쳐 그리는 멤버 사진 수. */
const FACES = 5;

/**
 * 프로젝트 개요(2026-11-15, Linear의 프로젝트 개요처럼 좁은 단): 프로젝트 목록에서 프로젝트를 누르면 열린다. 표식 · 이름 ·
 * 설명, 속성(내 역할 · 멤버 · 만든 날 · 고친 날), 업무의 진행(상태별 수와 완료율), 진행 중인 사이클, 최근에 바뀐 업무와 문서를
 * 한눈에 보이고 저마다의 화면으로 이어 준다. 멤버가 아닌 프로젝트는 찾을 수 없다.
 */
export function ProjectOverviewPage({ crumbs, projectKey }: { crumbs: Crumb[]; projectKey: string }) {
  const project = useQuery(projectOptions(projectKey));
  const key = project.data?.key ?? projectKey;
  const isReady = !!project.data;
  const members = useQuery({ ...projectMembersOptions(key), enabled: isReady });
  const groups = useQuery({ ...boardGroupsOptions(key, {}, 'STATUS'), enabled: isReady });
  const cycles = useQuery({ ...cyclesOptions(key), enabled: isReady });
  const workItems = useInfiniteQuery({ ...workItemsOptions(key, { sort: 'UPDATED', direction: 'DESC' }, RECENT), enabled: isReady });
  const documents = useInfiniteQuery({ ...documentsOptions({ project: key, top: true, sort: 'UPDATED', direction: 'DESC' }), enabled: isReady });
  const at = `/workspace/projects/${encodeURIComponent(key)}`;
  const body = (data: Project) => {
    const current = cycles.data?.cycles?.find(cycle => cycle.state === 'CURRENT');
    const recentItems = workItems.data?.pages[0]?.items ?? [];
    const recentDocuments = (documents.data?.pages[0]?.items ?? []).slice(0, RECENT);
    const people = members.data ?? [];
    return (
      <div className="flex justify-center px-4 pt-8 pb-2 md:px-8 md:py-10">
        <div className="flex w-full max-w-180 min-w-0 flex-col gap-10">
          <header className="flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <Mark icon={data.icon} color={data.color} letter={data.key} size="lg" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <h1 className="text-2xl font-semibold tracking-tight text-balance">{data.name}</h1>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium tabular-nums">{data.key}</span>
                  {data.archivedAt ? <span className="inline-flex items-center gap-1"><ArchiveIcon className="size-3.5" />보관됨</span> : null}
                  {data.myRole !== 'NONE' ? <ProjectRoleLabel role={data.myRole} /> : null}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" nativeButton={false} render={<Link to="/workspace/projects/$key/work-items" params={{ key }} />}><NotesIcon data-icon="inline-start" />업무</Button>
              <Button variant="secondary" size="sm" nativeButton={false} render={<Link to="/workspace/projects/$key/cycles" params={{ key }} />}><RepeatIcon data-icon="inline-start" />사이클</Button>
              <Button variant="secondary" size="sm" nativeButton={false} render={<Link to="/workspace/projects/$key/documents" params={{ key }} />}><FileTextIcon data-icon="inline-start" />문서</Button>
              {data.can.manage ? <Button variant="ghost" size="sm" nativeButton={false} render={<Link to="/workspace/projects/$key/settings/general" params={{ key }} />}><SettingsIcon data-icon="inline-start" />설정</Button> : null}
            </div>
          </header>

          {data.description?.trim()
            ? <MarkdownRead value={data.description} label={`${data.name} 설명`} />
            : <p className="text-sm text-muted-foreground">설명이 없습니다.</p>}

          <dl className="flex flex-col divide-y border-y">
            <ProjectOverviewFact label="멤버">
              <Link to={data.can.manage ? '/workspace/projects/$key/settings/members' : '/workspace/projects/$key/members'} params={{ key }} aria-label={`멤버 ${people.length}명 보기`}
                className="flex items-center gap-2 rounded-md outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
                <span className="flex items-center">
                  {people.slice(0, FACES).map((person, index) => (
                    <span key={person.userId} className={cn('rounded-full ring-2 ring-background', index > 0 && '-ml-1.5')}><PersonAvatar id={person.userId} name={person.name} size={20} isStatic /></span>
                  ))}
                </span>
                <span className="text-muted-foreground tabular-nums">{people.length > FACES ? `외 ${people.length - FACES}명` : `${data.memberCount}명`}</span>
              </Link>
            </ProjectOverviewFact>
            <ProjectOverviewFact label="만든 날"><span className="tabular-nums">{day.format(new Date(data.createdAt))}</span></ProjectOverviewFact>
            <ProjectOverviewFact label="고친 날"><span className="tabular-nums">{day.format(new Date(data.updatedAt))}</span></ProjectOverviewFact>
          </dl>

          <ProjectOverviewSection icon={NotesIcon} title="업무 진행" to={`${at}/work-items`} more="업무 보기">
            {groups.data ? <ProjectProgressCard groups={groups.data} /> : null}
          </ProjectOverviewSection>

          {current ? (
            <ProjectOverviewSection icon={RepeatIcon} title="진행 중인 사이클" to={`${at}/cycles`} more="사이클 보기">
              <ProjectCurrentCycleCard cycle={current} />
            </ProjectOverviewSection>
          ) : null}

          <ProjectOverviewSection icon={CalendarIcon} title="최근 업무" to={`${at}/work-items`}>
            {recentItems.length > 0
              ? <ul aria-label="최근 업무" className="flex flex-col overflow-hidden rounded-xl border bg-background">
                {/* 업무 줄은 저마다 목록 항목(li)이다. */}
                {recentItems.map(item => <WorkItemListRow key={item.id} workItem={item} href={workItemHref(item)} isCompact />)}
              </ul>
              : workItems.data ? <p className="text-sm text-muted-foreground">아직 업무가 없습니다.</p> : null}
          </ProjectOverviewSection>

          <ProjectOverviewSection icon={FileTextIcon} title="최근 문서" to={`${at}/documents`}>
            {recentDocuments.length > 0
              ? <ul aria-label="최근 문서" className="flex flex-col overflow-hidden rounded-xl border bg-background">
                {recentDocuments.map(document => (
                  <li key={document.id} className="border-b last:border-b-0">
                    <Link to="/workspace/projects/$key/documents/$documentId" params={{ key, documentId: document.id }}
                      className="flex min-h-10 items-center gap-3 px-3 text-sm outline-none hover:bg-row-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
                      <FileTextIcon className="size-4 shrink-0 text-icon-muted" />
                      <span className="min-w-0 flex-1 truncate">{document.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{document.updatedByName}</span>
                      {document.updatedAt ? <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{shortDay.format(new Date(document.updatedAt))}</span> : null}
                    </Link>
                  </li>
                ))}
              </ul>
              : documents.data ? <p className="text-sm text-muted-foreground">아직 문서가 없습니다.</p> : null}
          </ProjectOverviewSection>

        </div>
      </div>
    );
  };
  return (
    <Page crumbs={pageCrumbs(crumbs)}>
      {project.error
        ? project.error instanceof ApiError && project.error.status === 404
          ? <PageState kind="not-found" title="프로젝트를 찾을 수 없습니다" description="없는 프로젝트이거나 멤버가 아닌 프로젝트입니다. 필요하면 프로젝트 관리자에게 멤버로 넣어 달라고 요청하세요." />
          : <PageState kind="error" title="프로젝트를 불러오지 못했습니다" description={project.error.message} />
        : project.data ? body(project.data) : null}
    </Page>
  );
}
