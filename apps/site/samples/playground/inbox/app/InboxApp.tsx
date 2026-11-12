import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Link, Outlet, RouterProvider, useLocation, useParams,
  type ErrorComponentProps } from '@tanstack/react-router';
import { useCallback, useMemo, useState } from 'react';
import type { NavSpace } from '@/shared/ui/app-shell';
import { Button, buttonVariants } from '@/shared/ui/button';
import { ArchiveIcon, BellIcon, InboxIcon } from '@/shared/ui/icon';
import { Page } from '@/shared/ui/page';
import { PageState } from '@/shared/ui/page-state';
import { PlaygroundShell } from '@samples/playground/PlaygroundShell';
import { useShellLayout } from '../../../catalog/shell-layout';
import { initiallyRead, NotificationApiContext, NotificationReadContext, notificationQueries, seedNotifications, useNotificationApi, useNotificationRead,
  type Notification } from '../entities/notification';
import { createNotificationApi } from '../mocks/notification-api';
import { InboxPage } from '../pages/InboxPage';
import { NotificationPage } from '../pages/NotificationPage';

const spaceOf = (unread: number): NavSpace => ({
  id: 'main', title: '알림', sections: [{ title: '알림', isHeaderHidden: true, entries: [
    { path: '/inbox', label: '받은 알림', icon: InboxIcon, badge: unread || undefined },
    { path: '/archive', label: '보관함', icon: ArchiveIcon },
  ] }],
});

/** 셸: 메뉴에 안 읽은 수를 보인다. 수는 보관하지 않은 알림 중 아직 열지 않은 것이다. */
function Shell() {
  const api = useNotificationApi();
  const { read } = useNotificationRead();
  const query = useQuery(notificationQueries.all(api));
  const unread = (query.data ?? []).filter(each => !each.archived && !read.has(each.id)).length;
  const layout = useShellLayout();
  const location = useLocation();
  return <PlaygroundShell space={spaceOf(unread)} pathname={location.pathname} layout={layout}
    brand={isFolded => <Link to={'/inbox' as string} aria-label="알림 처음으로"
      className="flex min-w-0 items-center gap-2 rounded-lg px-2 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <BellIcon chosen className="size-5 shrink-0" />{isFolded ? null : <span className="truncate">알림</span>}
    </Link>}
    footer={isFolded => isFolded ? null : <span className="px-2 text-xs text-muted-foreground">예제 · 메모리 저장</span>}>
    <Outlet />
  </PlaygroundShell>;
}

function DetailRoute() {
  const { id } = useParams({ strict: false }) as { id: string };
  return <NotificationPage id={id} />;
}

function RouteError({ reset }: ErrorComponentProps) {
  return <Page crumbs={[{ label: '알림' }]}>
    <PageState kind="error" title="화면을 열 수 없습니다" description="잠시 후 다시 시도해 주세요." action={<Button variant="secondary" onClick={reset}>다시 시도</Button>} />
  </Page>;
}

function NotFound() {
  return <Page crumbs={[{ label: '받은 알림', href: '/inbox' }, { label: '없는 페이지' }]} isFullScreen>
    <PageState kind="not-found" title="페이지를 찾을 수 없습니다" description="주소가 바뀌었거나 지워졌을 수 있습니다."
      action={<Link to={'/inbox' as string} className={buttonVariants({ variant: 'secondary', className: 'max-md:h-11' })}>받은 알림으로</Link>} />
  </Page>;
}

export function createInboxRouter(initialPath: string) {
  const root = createRootRoute({ component: Shell, errorComponent: RouteError, notFoundComponent: NotFound });
  const home = createRoute({ getParentRoute: () => root, path: '/', component: () => <InboxPage scope="inbox" /> });
  const inbox = createRoute({ getParentRoute: () => root, path: '/inbox', component: () => <InboxPage scope="inbox" /> });
  const archive = createRoute({ getParentRoute: () => root, path: '/archive', component: () => <InboxPage scope="archive" /> });
  const detail = createRoute({ getParentRoute: () => root, path: '/inbox/$id', component: DetailRoute });
  return createRouter({
    routeTree: root.addChildren([home, inbox, archive, detail]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    defaultPreload: 'intent', scrollRestoration: true,
  });
}

/**
 * 인박스 앱의 조립: 조회 캐시, 모의 저장소, 읽음 표시. 견본마다 새로 만들며 메모리 히스토리를 쓴다. notifications를 주면
 * 그 알림으로 시작한다(빈 인박스 등). 테마와 셸 배치는 가이드 머리 줄이 정한다.
 */
export function InboxApp({ initialPath = '/inbox', notifications = seedNotifications, isFailing = false }: {
  initialPath?: string; notifications?: Notification[]; isFailing?: boolean;
}) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } }));
  const [api] = useState(() => createNotificationApi({ initial: notifications, fail: isFailing }));
  const [router] = useState(() => createInboxRouter(initialPath));
  const [read, setRead] = useState<ReadonlySet<string>>(() => new Set(initiallyRead));
  const markRead = useCallback((id: string) => setRead(ids => (ids.has(id) ? ids : new Set(ids).add(id))), []);
  const readState = useMemo(() => ({ read, markRead }), [read, markRead]);
  return <QueryClientProvider client={client}>
    <NotificationApiContext value={api}>
      <NotificationReadContext value={readState}><RouterProvider router={router} /></NotificationReadContext>
    </NotificationApiContext>
  </QueryClientProvider>;
}
