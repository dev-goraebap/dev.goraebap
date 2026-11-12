import { DraftProvider } from '@/shared/lib/draft';
import type { NavSpace } from '@/shared/ui/app-shell';
import { Button } from '@/shared/ui/button';
import { FileTextIcon, InboxIcon } from '@/shared/ui/icon';
import { Page } from '@/shared/ui/page';
import { PageState } from '@/shared/ui/page-state';
import { PlaygroundShell } from '@samples/playground/PlaygroundShell';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Link, Outlet, RouterProvider, useLocation, useNavigate, useParams, useSearch,
  type ErrorComponentProps } from '@tanstack/react-router';
import { useState } from 'react';
import { useShellLayout } from '../../../catalog/shell-layout';
import { ApprovalApiContext, approvalQueries, currentOf, me, useApprovalApi, type ApprovalApi } from '../entities/approval';
import { createApprovalApi } from '../mocks/approval-api';
import { InboxPage } from '../pages/inbox/InboxPage';
import { RequestCompose, type ComposeStep } from '../pages/request-compose/RequestCompose';
import { RequestDetailPage } from '../pages/request-detail/RequestDetailPage';
import { RequestsPage } from '../pages/requests/RequestsPage';

/** 라우터 주소의 타입은 사이트 라우터에 등록되어 있어, 견본 앱의 주소는 글자로 넘긴다. */
const HOME: string = '/requests';

const spaceOf = (waiting: number): NavSpace => ({
  id: 'main', title: '결재', sections: [{ title: '결재', isHeaderHidden: true, entries: [
    { path: '/requests', label: '내 신청', icon: FileTextIcon },
    { path: '/inbox', label: '결재할 문서', icon: InboxIcon, badge: waiting || undefined },
  ] }],
});

/** 로고는 홈으로 가는 길: 링크 색 없이, 키보드로 닿을 때만 고리. 접힌 사이드바에는 심벌만 남긴다. */
function Brand({ isFolded }: { isFolded: boolean }) {
  return (
    <Link to={HOME} aria-label="결재 처음으로" className="flex min-w-0 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <FileTextIcon chosen className="size-5 shrink-0" />
      {isFolded ? null : <span className="truncate font-semibold">결재</span>}
    </Link>
  );
}

/** 셸: 메뉴의 숫자는 지금 내 차례인 문서 수다. 결정하면 조회가 다시 읽혀 함께 줄어든다. */
function Shell() {
  const api = useApprovalApi();
  const layout = useShellLayout();
  const location = useLocation();
  const query = useQuery(approvalQueries.all(api));
  const waiting = (query.data ?? []).filter(each => each.applicant !== me && currentOf(each)?.approver === me).length;
  return (
    <PlaygroundShell space={spaceOf(waiting)} pathname={location.pathname} layout={layout} brand={isFolded => <Brand isFolded={isFolded} />}>
      <Outlet />
    </PlaygroundShell>
  );
}

function RequestsRoute() {
  const navigate = useNavigate();
  return <RequestsPage onCreate={() => void navigate({ href: '/requests/new' })} />;
}

function ComposeRoute() {
  const { step } = useSearch({ strict: false }) as { step: ComposeStep };
  const navigate = useNavigate();
  return <RequestCompose step={step} onStep={next => void navigate({ href: `/requests/new?step=${next}`, replace: true })}
    onClose={() => void navigate({ href: '/requests' })} onDone={id => void navigate({ href: `/requests/${id}`, replace: true })} />;
}

function DetailRoute() {
  const { id } = useParams({ strict: false }) as { id: string };
  return <RequestDetailPage id={id} />;
}

function RouteError({ reset }: ErrorComponentProps) {
  return (
    <Page crumbs={[{ label: '결재' }]}>
      <PageState kind="error" title="화면을 열 수 없습니다" description="잠시 후 다시 시도해 주세요." action={<Button variant="secondary" onClick={reset}>다시 시도</Button>} />
    </Page>
  );
}

function NotFound() {
  return (
    <Page crumbs={[{ label: '결재', href: '/requests' }, { label: '없는 페이지' }]} isFullScreen>
      <PageState kind="not-found" title="페이지를 찾을 수 없습니다" description="주소가 바뀌었거나 지워졌을 수 있습니다."
        action={<Button variant="secondary" nativeButton={false} render={<Link to={HOME} />}>내 신청으로</Button>} />
    </Page>
  );
}

export function createApprovalRouter(initialPath: string) {
  const root = createRootRoute({ component: Shell, errorComponent: RouteError, notFoundComponent: NotFound });
  const home = createRoute({ getParentRoute: () => root, path: '/', component: RequestsRoute });
  const requests = createRoute({ getParentRoute: () => root, path: '/requests', component: RequestsRoute });
  const create = createRoute({ getParentRoute: () => root, path: '/requests/new', component: ComposeRoute,
    validateSearch: (raw: Record<string, unknown>): { step: ComposeStep } => ({ step: raw.step === 'line' || raw.step === 'review' ? raw.step : 'info' }) });
  const detail = createRoute({ getParentRoute: () => root, path: '/requests/$id', component: DetailRoute });
  const inbox = createRoute({ getParentRoute: () => root, path: '/inbox', component: InboxPage });
  return createRouter({
    routeTree: root.addChildren([home, requests, create, detail, inbox]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    defaultPreload: 'intent', scrollRestoration: true,
  });
}

/**
 * 결재 앱의 조립: 조회 캐시, 모의 저장소, 라우터보다 위의 초안 경계. 견본마다 새로 만들며 메모리 히스토리를 쓴다. 테마와 셸 배치는
 * 가이드 머리 줄이 정한다.
 */
export function ApprovalApp({ api, initialPath = '/requests' }: { api?: ApprovalApi; initialPath?: string }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } }));
  const [repository] = useState(() => api ?? createApprovalApi({ delay: 60 }));
  const [router] = useState(() => createApprovalRouter(initialPath));
  return (
    <QueryClientProvider client={client}>
      <ApprovalApiContext value={repository}>
        <DraftProvider><RouterProvider router={router} /></DraftProvider>
      </ApprovalApiContext>
    </QueryClientProvider>
  );
}
