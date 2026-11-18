import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Link, Outlet, RouterProvider, useLocation, useNavigate, useParams, useSearch,
  type ErrorComponentProps } from '@tanstack/react-router';
import { useState } from 'react';
import { DraftProvider } from '@/shared/lib/draft';
import type { NavSpace } from '@/shared/ui/kit/layout/app-shell';
import { Button, buttonVariants } from '@/shared/ui/kit/button';
import { TagIcon } from '@/shared/ui/kit/icon';
import { Page } from '@/shared/ui/kit/layout/page';
import { PageState } from '@/shared/ui/kit/page-state';
import { PlaygroundShell } from '@samples/playground/PlaygroundShell';
import { useShellLayout } from '../../../catalog/shell-layout';
import { IssueApiContext, type IssueApi } from '../entities/issue';
import { createIssueApi } from '../mocks/issue-api';
import { IssueCompose } from '../pages/issue-compose/IssueCompose';
import { IssueDetailPage } from '../pages/issue-detail/IssueDetailPage';
import { IssueEditPage } from '../pages/issue-edit/IssueEditPage';
import { IssuesPage } from '../pages/issues/IssuesPage';
import { validateIssuesSearch } from '../pages/issues/model';

const space: NavSpace = {
  id: 'main', title: '이슈', sections: [{ title: '이슈', isHeaderHidden: true, entries: [{ path: '/issues', label: '이슈', icon: TagIcon }] }],
};

/** 셸: 주소가 메뉴의 지금 항목을 정한다. 로고는 홈(목록)으로 가는 길이다. */
function Shell() {
  const layout = useShellLayout();
  const location = useLocation();
  return <PlaygroundShell space={space} pathname={location.pathname} layout={layout}
    brand={isFolded => <Link to={'/issues' as string} aria-label="이슈 처음으로"
      className="flex min-w-0 items-center gap-2 rounded-lg px-2 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <TagIcon chosen className="size-5 shrink-0" />{isFolded ? null : <span className="truncate">이슈</span>}
    </Link>}>
    <Outlet />
  </PlaygroundShell>;
}

/** 목록. 페이지 이동형(Drill-down)이라 만들기는 작성 페이지(/issues/new)로 간다. */
function ListRoute() {
  const navigate = useNavigate();
  return <IssuesPage onCreate={() => void navigate({ href: '/issues/new' })} />;
}

function DetailRoute() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  return <IssueDetailPage id={id} onEdit={() => void navigate({ href: `/issues/${id}/edit` })} onAddSub={() => void navigate({ href: `/issues/new?parent=${id}` })} />;
}

/** 수정 화면: 상세의 편집 단추가 늘 이곳을 연다. 끝나면(완료 · 취소) 상세로 돌아간다. */
function EditRoute() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  return <IssueEditPage id={id} onLeave={() => void navigate({ href: `/issues/${id}` })} />;
}

function ComposeRoute() {
  const { parent } = useSearch({ strict: false }) as { parent?: string };
  const navigate = useNavigate();
  return <IssueCompose parent={parent} surface="page" onClose={() => void navigate({ href: parent ? `/issues/${parent}` : '/issues' })}
    onDone={next => void navigate({ href: `/issues/${next}`, replace: true })} />;
}

function RouteError({ reset }: ErrorComponentProps) {
  return <Page crumbs={[{ label: '이슈', icon: TagIcon }]}>
    <PageState kind="error" title="화면을 열 수 없습니다" action={<Button variant="secondary" onClick={reset}>다시 시도</Button>} />
  </Page>;
}

function NotFound() {
  return <Page crumbs={[{ label: '이슈', href: '/issues', icon: TagIcon }, { label: '없는 페이지' }]} isFullScreen>
    <PageState kind="not-found" title="페이지를 찾을 수 없습니다"
      action={<Link to={'/issues' as string} className={buttonVariants({ variant: 'secondary', className: 'max-md:h-11' })}>이슈 목록으로</Link>} />
  </Page>;
}

export function createIssuesRouter(initialPath: string) {
  const root = createRootRoute({ component: Shell, errorComponent: RouteError, notFoundComponent: NotFound });
  const list = createRoute({ getParentRoute: () => root, path: '/issues', component: ListRoute, validateSearch: validateIssuesSearch });
  const home = createRoute({ getParentRoute: () => root, path: '/', component: ListRoute, validateSearch: validateIssuesSearch });
  const create = createRoute({ getParentRoute: () => root, path: '/issues/new', component: ComposeRoute,
    validateSearch: (raw: Record<string, unknown>) => ({ parent: typeof raw.parent === 'string' && /^ISS-\d+$/.test(raw.parent) ? raw.parent : undefined }) });
  const detail = createRoute({ getParentRoute: () => root, path: '/issues/$id', component: DetailRoute });
  const edit = createRoute({ getParentRoute: () => root, path: '/issues/$id/edit', component: EditRoute });
  return createRouter({
    routeTree: root.addChildren([home, list, create, detail, edit]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    unmaskOnReload: true, defaultPreload: 'intent', scrollRestoration: true,
  });
}

/**
 * 이슈 앱의 조립: 조회 캐시, 모의 저장소, 라우터보다 위의 초안 경계. 견본마다 새로 만들며 메모리 히스토리를 쓴다. 테마와 셸 배치는
 * 가이드 머리 줄이 정한다.
 */
export function IssuesApp({ api, initialPath = '/issues' }: { api?: IssueApi; initialPath?: string }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } }));
  const [repository] = useState(() => api ?? createIssueApi({ delay: 60 }));
  const [router] = useState(() => createIssuesRouter(initialPath));
  return <QueryClientProvider client={client}>
    <IssueApiContext value={repository}>
      <DraftProvider><RouterProvider router={router} /></DraftProvider>
    </IssueApiContext>
  </QueryClientProvider>;
}
