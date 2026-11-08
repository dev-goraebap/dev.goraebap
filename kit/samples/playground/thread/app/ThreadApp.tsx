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
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider, useLocation, useNavigate, useParams,
  type ErrorComponentProps } from '@tanstack/react-router';
import { useCallback, useMemo, useState } from 'react';
import { useShellLayout } from '../../../catalog/shell-layout';
import { OutboxContext, ThreadApiContext, threadQueries, useThreadApi, type Outgoing, type ThreadApi } from '../entities/thread';
import { createThreadApi } from '../mocks/thread-api';
import { RoomPage } from '../pages/RoomPage';
import { RoomsPage } from '../pages/RoomsPage';

/** 셸: 메뉴가 대화방을 나열한다. */
function Shell() {
  const api = useThreadApi();
  const rooms = useQuery(threadQueries.rooms(api));
  const space: NavSpace = {
    id: 'main', title: '대화', sections: [{ title: '대화방', entries: (rooms.data ?? []).map(room => ({ path: `/rooms/${room.id}`, label: room.name, icon: 'comment' as const })) }],
  };
  const layout = useShellLayout();
  const location = useLocation();
  const navigate = useNavigate();
  return <LinkProvider component={RouterLink}>
    <AppFrame space={space} pathname={location.pathname} layout={layout} onNavigate={path => void navigate({ href: path })}
      brand={isFolded => <HStack gap={2} vAlign="center" paddingInline={2}>{icon('comment', true)}{isFolded ? null : <Text weight="semibold">대화</Text>}</HStack>}
      footer={<HStack width="100%" paddingInline={2}><Text type="supporting" color="secondary" hasTabularNumbers>예제 · 메모리 저장</Text></HStack>}>
      <Outlet />
    </AppFrame>
  </LinkProvider>;
}

function RoomRoute() {
  const { id } = useParams({ strict: false }) as { id: string };
  return <RoomPage key={id} roomId={id} />;
}

function RouteError({ reset }: ErrorComponentProps) {
  return <Page crumbs={[{ label: '대화' }]}>
    <PageState kind="error" title="화면을 열 수 없습니다" description="잠시 후 다시 시도해 주세요." action={<Button label="다시 시도" variant="secondary" onClick={reset} />} />
  </Page>;
}

function NotFound() {
  return <Page crumbs={[{ label: '대화', href: '/rooms' }, { label: '없는 페이지' }]} isDetail>
    <PageState kind="not-found" title="페이지를 찾을 수 없습니다" description="주소가 바뀌었거나 지워졌을 수 있습니다."
      action={<Button label="대화 목록으로" variant="secondary" href="/rooms" />} />
  </Page>;
}

export function createThreadRouter(initialPath: string) {
  const root = createRootRoute({ component: Shell, errorComponent: RouteError, notFoundComponent: NotFound });
  const home = createRoute({ getParentRoute: () => root, path: '/', component: RoomsPage });
  const list = createRoute({ getParentRoute: () => root, path: '/rooms', component: RoomsPage });
  const room = createRoute({ getParentRoute: () => root, path: '/rooms/$id', component: RoomRoute });
  return createRouter({
    routeTree: root.addChildren([home, list, room]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    defaultPreload: 'intent', scrollRestoration: false,
  });
}

/**
 * 대화 앱의 조립: 조회 캐시, 모의 서버, 보내는 중·실패 메시지 보관. 견본마다 새로 만들며 메모리 히스토리를 쓴다. api를 주면
 * 그 서버로, initialOutbox를 주면 보내지 못한 메시지가 있는 채로 시작한다. 테마와 셸 배치는 가이드 머리 줄이 정한다.
 */
export function ThreadApp({ initialPath = '/rooms/design', api, incomingAfter, initialOutbox = {} }: {
  initialPath?: string; api?: ThreadApi; incomingAfter?: number; initialOutbox?: Record<string, Outgoing[]>;
}) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } }));
  const [server] = useState(() => api ?? createThreadApi({ incomingAfter }));
  const [router] = useState(() => createThreadRouter(initialPath));
  const [outbox, setAll] = useState<Record<string, Outgoing[]>>(initialOutbox);
  const setOutbox = useCallback((roomId: string, update: (list: Outgoing[]) => Outgoing[]) => setAll(all => ({ ...all, [roomId]: update(all[roomId] ?? []) })), []);
  const outboxState = useMemo(() => ({ outbox, setOutbox }), [outbox, setOutbox]);
  return <QueryClientProvider client={client}>
    <ThreadApiContext value={server}>
      <OutboxContext value={outboxState}><RouterProvider router={router} /></OutboxContext>
    </ThreadApiContext>
  </QueryClientProvider>;
}
