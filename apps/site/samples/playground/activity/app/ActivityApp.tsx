import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Link, Outlet, RouterProvider, useLocation,
  type ErrorComponentProps } from '@tanstack/react-router';
import { useState } from 'react';
import type { NavSpace } from '@/shared/ui/app-shell';
import { Button, buttonVariants } from '@/shared/ui/button';
import { HistoryIcon } from '@/shared/ui/icon';
import { Page } from '@/shared/ui/page';
import { PageState } from '@/shared/ui/page-state';
import { PlaygroundShell } from '@samples/playground/PlaygroundShell';
import { useShellLayout } from '../../../catalog/shell-layout';
import { ActivityApiContext, type ActivityApi } from '../entities/activity';
import { createActivityApi } from '../mocks/activity-api';
import { ActivityPage } from '../pages/ActivityPage';

const space: NavSpace = {
  id: 'main', title: '활동', sections: [{ title: '활동', isHeaderHidden: true, entries: [{ path: '/activity', label: '활동 기록', icon: HistoryIcon }] }],
};

function Shell() {
  const layout = useShellLayout();
  const location = useLocation();
  return <PlaygroundShell space={space} pathname={location.pathname} layout={layout}
    brand={isFolded => <Link to={'/activity' as string} aria-label="활동 처음으로"
      className="flex min-w-0 items-center gap-2 rounded-lg px-2 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <HistoryIcon chosen className="size-5 shrink-0" />{isFolded ? null : <span className="truncate">활동</span>}
    </Link>}
    footer={isFolded => isFolded ? null : <span className="px-2 text-xs text-muted-foreground">예제 · 메모리 저장</span>}>
    <Outlet />
  </PlaygroundShell>;
}

function RouteError({ reset }: ErrorComponentProps) {
  return <Page crumbs={[{ label: '활동 기록', icon: HistoryIcon }]}>
    <PageState kind="error" title="화면을 열 수 없습니다" description="잠시 후 다시 시도해 주세요." action={<Button variant="secondary" onClick={reset}>다시 시도</Button>} />
  </Page>;
}

function NotFound() {
  return <Page crumbs={[{ label: '활동 기록', href: '/activity' }, { label: '없는 페이지' }]} isFullScreen>
    <PageState kind="not-found" title="페이지를 찾을 수 없습니다" description="주소가 바뀌었거나 지워졌을 수 있습니다."
      action={<Link to={'/activity' as string} className={buttonVariants({ variant: 'secondary', className: 'max-md:h-11' })}>활동 기록으로</Link>} />
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
