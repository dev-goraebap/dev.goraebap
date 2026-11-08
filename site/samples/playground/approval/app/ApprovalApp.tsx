import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { LinkProvider } from '@astryxdesign/core/Link';
import { Text } from '@astryxdesign/core/Text';
import { PageState } from '@/shared/ui/composites/state/PageState';
import { icon } from '@/shared/ui/foundations/icons/solar-icon';
import { PlaygroundFrame as AppFrame } from '@samples/playground/PlaygroundFrame';
import type { NavSpace } from '@/shared/ui/layouts/app/nav';
import { Page } from '@/shared/ui/layouts/page/Page';
import { DraftProvider } from '@/shared/ui/patterns/compose/draft-store';
import { RouterLink } from '@/shared/ui/patterns/routing/RouterLink';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider, useLocation, useNavigate, useParams, useSearch,
  type ErrorComponentProps } from '@tanstack/react-router';
import { useState } from 'react';
import { ApprovalApiContext, approvalQueries, currentOf, me, useApprovalApi, type ApprovalApi } from '../entities/approval';
import { createApprovalApi } from '../mocks/approval-api';
import { InboxPage } from '../pages/inbox/InboxPage';
import { RequestCompose, type ComposeStep } from '../pages/request-compose/RequestCompose';
import { RequestDetailPage } from '../pages/request-detail/RequestDetailPage';
import { RequestsPage } from '../pages/requests/RequestsPage';
import { useShellLayout } from '../../../catalog/shell-layout';
import styles from './app.module.css';

const spaceOf = (waiting: number): NavSpace => ({
  id: 'main', title: '결재', sections: [{ title: '결재', isHeaderHidden: true, entries: [
    { path: '/requests', label: '내 신청', icon: 'document' },
    { path: '/inbox', label: '결재할 문서', icon: 'inbox', badge: waiting || undefined },
  ] }],
});

/** 셸: 메뉴의 숫자는 지금 내 차례인 문서 수다. 결정하면 조회가 다시 읽혀 함께 줄어든다. */
function Shell() {
  const api = useApprovalApi();
  const layout = useShellLayout();
  const location = useLocation();
  const navigate = useNavigate();
  const query = useQuery(approvalQueries.all(api));
  const waiting = (query.data ?? []).filter(each => each.applicant !== me && currentOf(each)?.approver === me).length;
  return <LinkProvider component={RouterLink}>
    <AppFrame space={spaceOf(waiting)} pathname={location.pathname} layout={layout} onNavigate={path => void navigate({ href: path })}
      brand={isFolded => <a className={styles.brand} href="/requests" aria-label="결재 처음으로" onClick={event => { event.preventDefault(); void navigate({ href: '/requests' }); }}>
        <HStack gap={2} vAlign="center">{icon('document', true)}{isFolded ? null : <Text weight="semibold">결재</Text>}</HStack>
      </a>}>
      <Outlet />
    </AppFrame>
  </LinkProvider>;
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
  return <Page crumbs={[{ label: '결재' }]}>
    <PageState kind="error" title="화면을 열 수 없습니다" description="잠시 후 다시 시도해 주세요." action={<Button label="다시 시도" variant="secondary" onClick={reset} />} />
  </Page>;
}

function NotFound() {
  return <Page crumbs={[{ label: '결재', href: '/requests' }, { label: '없는 페이지' }]} isDetail>
    <PageState kind="not-found" title="페이지를 찾을 수 없습니다" description="주소가 바뀌었거나 지워졌을 수 있습니다."
      action={<Button label="내 신청으로" variant="secondary" href="/requests" />} />
  </Page>;
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
  return <QueryClientProvider client={client}>
    <ApprovalApiContext value={repository}>
      <DraftProvider><RouterProvider router={router} /></DraftProvider>
    </ApprovalApiContext>
  </QueryClientProvider>;
}
