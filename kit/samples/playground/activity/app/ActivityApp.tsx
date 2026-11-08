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
import { useState } from 'react';
import { useShellLayout } from '../../../catalog/shell-layout';
import { ActivityApiContext, type ActivityApi } from '../entities/activity';
import { createActivityApi } from '../mocks/activity-api';
import { ActivityPage } from '../pages/ActivityPage';

const space: NavSpace = {
  id: 'main', title: '활동', sections: [{ title: '활동', isHeaderHidden: true, entries: [{ path: '/activity', label: '활동 기록', icon: 'clock' }] }],
};

function Shell() {
  const layout = useShellLayout();
  const location = useLocation();
  const navigate = useNavigate();
  return <LinkProvider component={RouterLink}>
    <AppFrame space={space} pathname={location.pathname} layout={layout} onNavigate={path => void navigate({ href: path })}
      brand={isFolded => <HStack gap={2} vAlign="center" paddingInline={2}>{icon('clock', true)}{isFolded ? null : <Text weight="semibold">활동</Text>}</HStack>}
      footer={<HStack width="100%" paddingInline={2}><Text type="supporting" color="secondary" hasTabularNumbers>예제 · 메모리 저장</Text></HStack>}>
      <Outlet />
    </AppFrame>
  </LinkProvider>;
}

function RouteError({ reset }: ErrorComponentProps) {
  return <Page crumbs={[{ label: '활동 기록' }]}>
    <PageState kind="error" title="화면을 열 수 없습니다" description="잠시 후 다시 시도해 주세요." action={<Button label="다시 시도" variant="secondary" onClick={reset} />} />
  </Page>;
}

function NotFound() {
  return <Page crumbs={[{ label: '활동 기록', href: '/activity' }, { label: '없는 페이지' }]} isDetail>
    <PageState kind="not-found" title="페이지를 찾을 수 없습니다" description="주소가 바뀌었거나 지워졌을 수 있습니다."
      action={<Button label="활동 기록으로" variant="secondary" href="/activity" />} />
  </Page>;
}

export function createActivityRouter(initialPath: string) {
  const root = createRootRoute({ component: Shell, errorComponent: RouteError, notFoundComponent: NotFound });
  const home = createRoute({ getParentRoute: () => root, path: '/', component: ActivityPage });
  const activity = createRoute({ getParentRoute: () => root, path: '/activity', component: ActivityPage });
  return createRouter({
    routeTree: root.addChildren([home, activity]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    defaultPreload: 'intent', scrollRestoration: false,
  });
}

/** 활동 기록 앱의 조립: 조회 캐시와 모의 저장소. 견본마다 새로 만들며 메모리 히스토리를 쓴다. 테마와 셸 배치는 가이드 머리 줄이 정한다. */
export function ActivityApp({ initialPath = '/activity', api }: { initialPath?: string; api?: ActivityApi }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } }));
  const [server] = useState(() => api ?? createActivityApi());
  const [router] = useState(() => createActivityRouter(initialPath));
  return <QueryClientProvider client={client}>
    <ActivityApiContext value={server}><RouterProvider router={router} /></ActivityApiContext>
  </QueryClientProvider>;
}
