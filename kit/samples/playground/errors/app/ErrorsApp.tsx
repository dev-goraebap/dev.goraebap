import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { LinkProvider } from '@astryxdesign/core/Link';
import { Text } from '@astryxdesign/core/Text';
import { PageState } from '@kit/composites/state/PageState';
import { icon } from '@kit/foundations/icons/solar-icon';
import { PlaygroundFrame as AppFrame } from '@samples/playground/PlaygroundFrame';
import type { NavSpace } from '@kit/layouts/app/nav';
import { Page } from '@kit/layouts/page/Page';
import { RouterLink } from '@kit/patterns/routing/RouterLink';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider, useLocation, useNavigate,
  type ErrorComponentProps } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useShellLayout } from '../../../catalog/shell-layout';
import { SessionApiContext, type SessionApi } from '../entities/session';
import { createSessionApi } from '../mocks/session-api';
import { MaintenancePage } from '../pages/maintenance/MaintenancePage';
import { NotePage } from '../pages/note/NotePage';
import { SessionGate } from '../pages/relogin/SessionGate';
import { RestrictedPage } from '../pages/restricted/RestrictedPage';

const space: NavSpace = {
  id: 'main', title: '작업 공간', sections: [
    { title: '작업', isHeaderHidden: true, entries: [
      { path: '/notes/new', label: '메모 쓰기', icon: 'edit' },
      { path: '/docs/plan', label: '설계 문서', icon: 'document' },
    ] },
  ],
};

/** 점검 화면은 셸 밖이고, 나머지는 같은 셸 안이다. 세션 만료 대화상자는 어느 화면 위에서든 열린다. */
function Frame() {
  const layout = useShellLayout();
  const location = useLocation();
  const navigate = useNavigate();
  if (location.pathname === '/maintenance') return <LinkProvider component={RouterLink}><Outlet /></LinkProvider>;
  return <LinkProvider component={RouterLink}>
    <AppFrame space={space} pathname={location.pathname} layout={layout} onNavigate={path => void navigate({ href: path })}
      brand={isFolded => <HStack gap={2} vAlign="center">{icon('document', true)}{isFolded ? null : <Text weight="semibold">작업 공간</Text>}</HStack>}>
      <Outlet />
    </AppFrame>
  </LinkProvider>;
}

function RouteError({ reset }: ErrorComponentProps) {
  return <Page crumbs={[{ label: '작업 공간' }]}>
    <PageState kind="error" title="화면을 열 수 없습니다" description="잠시 후 다시 시도해 주세요." action={<Button label="다시 시도" variant="secondary" onClick={reset} />} />
  </Page>;
}

/** 셸 안의 404: 메뉴는 그대로 두고 본문만 "없음"으로 바꾼다. 돌아갈 곳 하나를 둔다. */
function NotFound() {
  return <Page crumbs={[{ label: '작업 공간' }, { label: '없는 페이지' }]} isDetail>
    <PageState kind="not-found" title="페이지를 찾을 수 없습니다" description="주소가 바뀌었거나 지워졌을 수 있습니다."
      action={<Button label="메모 쓰기로" variant="secondary" href="/notes/new" />} />
  </Page>;
}

function ToNotes() {
  const navigate = useNavigate();
  useEffect(() => { void navigate({ href: '/notes/new', replace: true }); }, [navigate]);
  return null;
}

export function createErrorsRouter(initialPath: string) {
  const root = createRootRoute({ component: Frame, errorComponent: RouteError, notFoundComponent: NotFound });
  const home = createRoute({ getParentRoute: () => root, path: '/', component: ToNotes });
  const note = createRoute({ getParentRoute: () => root, path: '/notes/new', component: NotePage });
  const plan = createRoute({ getParentRoute: () => root, path: '/docs/plan', component: function PlanRoute() {
    const navigate = useNavigate();
    return <RestrictedPage onLeave={() => void navigate({ href: '/notes/new' })} />;
  } });
  const maintenance = createRoute({ getParentRoute: () => root, path: '/maintenance', component: function MaintenanceRoute() {
    const navigate = useNavigate();
    return <MaintenancePage onReopened={() => void navigate({ href: '/notes/new', replace: true })} />;
  } });
  return createRouter({
    routeTree: root.addChildren([home, note, plan, maintenance]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
}

/** 막힌 상태 앱의 조립. 견본마다 메모리 라우터와 모의 서버를 새로 만든다. */
export function ErrorsApp({ api, initialPath = '/notes/new', isExpired = false }: { api?: SessionApi; initialPath?: string; isExpired?: boolean }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }));
  const [repository] = useState(() => api ?? createSessionApi({ delay: 500, isExpired }));
  const [router] = useState(() => createErrorsRouter(initialPath));
  return <QueryClientProvider client={client}>
    <SessionApiContext value={repository}><SessionGate initialExpired={isExpired}><RouterProvider router={router} /></SessionGate></SessionApiContext>
  </QueryClientProvider>;
}
