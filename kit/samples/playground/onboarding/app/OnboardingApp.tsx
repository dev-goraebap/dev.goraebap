import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { LinkProvider } from '@astryxdesign/core/Link';
import { Text } from '@astryxdesign/core/Text';
import { PageState } from '@kit/composites/state/PageState';
import { icon } from '@kit/foundations/icons/solar-icon';
import { AppFrame } from '@kit/layouts/app/AppFrame';
import type { NavSpace } from '@kit/layouts/app/nav';
import { Page } from '@kit/layouts/page/Page';
import { RouterLink } from '@kit/patterns/routing/RouterLink';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider, useLocation, useNavigate,
  type ErrorComponentProps } from '@tanstack/react-router';
import { useState } from 'react';
import { useShellLayout } from '../../../catalog/shell-layout';
import { remainingOf, useWorkspace, WorkspaceApiContext, type WorkspaceApi } from '../entities/workspace';
import { createWorkspaceApi, type Seed } from '../mocks/workspace-api';
import { HomePage } from '../pages/home/HomePage';
import { SetupPage } from '../pages/setup/SetupPage';

/** 시작하기 메뉴의 배지는 아직 하지 않은 단계 수다. 다 하거나 미루면 사라진다. */
function Shell() {
  const layout = useShellLayout();
  const location = useLocation();
  const navigate = useNavigate();
  const { data } = useWorkspace();
  const remaining = data ? remainingOf(data) : 0;
  const space: NavSpace = {
    id: 'main', title: '작업 공간', sections: [
      { title: '작업', isHeaderHidden: true, entries: [
        { path: '/', label: '프로젝트', icon: 'folder' },
        { path: '/setup', label: '시작하기', icon: 'done', badge: remaining || undefined },
      ] },
    ],
  };
  return <LinkProvider component={RouterLink}>
    <AppFrame space={space} pathname={location.pathname} layout={layout} onNavigate={path => void navigate({ href: path })}
      brand={isFolded => <HStack gap={2} vAlign="center">{icon('library', true)}{isFolded ? null : <Text weight="semibold">작업 공간</Text>}</HStack>}>
      <Outlet />
    </AppFrame>
  </LinkProvider>;
}

function RouteError({ reset }: ErrorComponentProps) {
  return <Page crumbs={[{ label: '작업 공간' }]}>
    <PageState kind="error" title="화면을 열 수 없습니다" description="잠시 후 다시 시도해 주세요." action={<Button label="다시 시도" variant="secondary" onClick={reset} />} />
  </Page>;
}

function NotFound() {
  return <Page crumbs={[{ label: '작업 공간' }, { label: '없는 페이지' }]} isDetail>
    <PageState kind="not-found" title="페이지를 찾을 수 없습니다" description="주소가 바뀌었거나 지워졌을 수 있습니다."
      action={<Button label="프로젝트로" variant="secondary" href="/" />} />
  </Page>;
}

export function createOnboardingRouter(initialPath: string) {
  const root = createRootRoute({ component: Shell, errorComponent: RouteError, notFoundComponent: NotFound });
  const home = createRoute({ getParentRoute: () => root, path: '/', component: HomePage });
  const setup = createRoute({ getParentRoute: () => root, path: '/setup', component: function SetupRoute() {
    const navigate = useNavigate();
    return <SetupPage onFinish={() => void navigate({ href: '/' })} />;
  } });
  return createRouter({ routeTree: root.addChildren([home, setup]), history: createMemoryHistory({ initialEntries: [initialPath] }) });
}

/** 처음 시작 앱의 조립. seed는 모의 작업 공간의 시작 상태이고, 견본마다 새로 만든다. */
export function OnboardingApp({ api, initialPath = '/', seed = 'empty' }: { api?: WorkspaceApi; initialPath?: string; seed?: Seed }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false }, mutations: { retry: false } } }));
  const [repository] = useState(() => api ?? createWorkspaceApi({ delay: 400, seed }));
  const [router] = useState(() => createOnboardingRouter(initialPath));
  return <QueryClientProvider client={client}>
    <WorkspaceApiContext value={repository}><RouterProvider router={router} /></WorkspaceApiContext>
  </QueryClientProvider>;
}
