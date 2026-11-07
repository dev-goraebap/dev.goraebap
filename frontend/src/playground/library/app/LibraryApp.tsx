import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { LinkProvider } from '@astryxdesign/core/Link';
import { PageState } from '@kit/composites/state/PageState';
import { icon } from '@kit/foundations/icons/solar-icon';
import { AppFrame, type ShellLayout } from '@kit/layouts/app/AppFrame';
import type { NavSpace } from '@kit/layouts/app/nav';
import { Page } from '@kit/layouts/page/Page';
import { DensityContext, type Density } from '@kit/layouts/page/PageParts';
import { DraftProvider } from '@kit/patterns/compose/draft-store';
import { RouterLink } from '@kit/patterns/routing/RouterLink';
import { useOpenPanel, useRoutedPanel } from '@kit/patterns/routing/routed-panel';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider, useLocation, useNavigate, useParams,
  type ErrorComponentProps } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { collections, ResourceApiContext, type ResourceApi } from '../entities/resource';
import { createResourceApi } from '../mocks/resource-api';
import { LibraryPage } from '../pages/library/LibraryPage';
import { validateLibrarySearch } from '../pages/library/model';
import { ResourceCompose } from '../pages/resource-compose/ResourceCompose';
import { ResourceDetailPage } from '../pages/resource-detail/ResourceDetailPage';
import { DisplaySettingsPage } from '../pages/settings/DisplaySettingsPage';
import { AppearanceContext, useAppearance } from './appearance';
import styles from './app.module.css';

const space: NavSpace = {
  id: 'main', title: '서가', sections: [
    { title: '서가', isHeaderHidden: true, entries: [
      { path: '/resources', label: '모든 자료', icon: 'library' },
      { path: '/resources?starred=true', label: '즐겨찾기', icon: 'star' },
    ] },
    { title: '컬렉션', entries: collections.map(each => ({ path: `/resources?collection=${each.id}`, label: each.name, icon: 'folder' as const })) },
    { title: '설정', entries: [{ path: '/settings', label: '화면 설정', icon: 'settings' }] },
  ],
};

/** 셸: 주소가 메뉴의 현재 항목을 정한다. 컬렉션·즐겨찾기처럼 검색 조건으로 나뉜 항목은 조건까지 비교한다. */
function Shell() {
  const { layout } = useAppearance();
  const location = useLocation();
  const navigate = useNavigate();
  const search = location.search as Record<string, unknown>;
  const isSelected = (path: string) => {
    const [base, query] = path.split('?');
    if (location.pathname !== base && !(base === '/resources' && location.pathname.startsWith('/resources/'))) return false;
    const wanted = new URLSearchParams(query);
    if (base !== '/resources') return location.pathname === base;
    if (!query) return !search.collection && !search.starred;
    return [...wanted].every(([key, value]) => String(search[key]) === value);
  };
  return <LinkProvider component={RouterLink}>
    <AppFrame space={space} pathname={location.pathname} isSelected={isSelected} layout={layout}
      onNavigate={path => void navigate({ href: path })}
      brand={isFolded => <a className={styles.brand} href="/resources" aria-label="서가 처음으로" onClick={event => { event.preventDefault(); void navigate({ href: '/resources' }); }}>
        <HStack gap={2} vAlign="center">{icon('library', true)}{isFolded ? null : <Text weight="semibold">서가</Text>}</HStack>
      </a>}
      footer={<HStack width="100%" paddingInline={2}><Text type="supporting" color="secondary" hasTabularNumbers>예제 · 메모리 저장</Text></HStack>}>
      <Outlet />
    </AppFrame>
  </LinkProvider>;
}

/** 목록과 목록 위의 작성 대화상자. 휴대폰 폭에서 ?panel이 남아 있으면 그 페이지로 옮긴다. */
function ListRoute() {
  const open = useOpenPanel();
  const panel = useRoutedPanel();
  const navigate = useNavigate();
  useEffect(() => { if (panel.pendingPhoneHref) void navigate({ href: panel.pendingPhoneHref, replace: true }); }, [panel.pendingPhoneHref, navigate]);
  const edit = panel.href?.match(/^\/resources\/([^/]+)\/edit$/)?.[1];
  return <>
    <LibraryPage onCreate={() => open('/resources/new')} />
    {panel.href === '/resources/new' || edit
      ? <ResourceCompose key={panel.href} id={edit} surface="dialog" onClose={panel.close} onExpand={panel.expand} onDone={id => panel.done(`/resources/${id}`)} />
      : null}
  </>;
}

function DetailRoute() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  return <ResourceDetailPage id={id} onEdit={() => void navigate({ href: `/resources/${id}/edit` })} onDeleted={() => void navigate({ href: '/resources', replace: true })} />;
}

function ComposeRoute() {
  const { id } = useParams({ strict: false }) as { id?: string };
  const navigate = useNavigate();
  return <ResourceCompose id={id} surface="page" onClose={() => void navigate({ href: id ? `/resources/${id}` : '/resources' })}
    onDone={next => void navigate({ href: `/resources/${next}`, replace: true })} />;
}

function RouteError({ reset }: ErrorComponentProps) {
  return <Page crumbs={[{ label: '서가' }]}>
    <PageState kind="error" title="화면을 열 수 없습니다" description="잠시 후 다시 시도해 주세요." action={<Button label="다시 시도" variant="secondary" onClick={reset} />} />
  </Page>;
}

function NotFound() {
  return <Page crumbs={[{ label: '서가', href: '/resources' }, { label: '없는 페이지' }]} isDetail>
    <PageState kind="not-found" title="페이지를 찾을 수 없습니다" description="주소가 바뀌었거나 지워졌을 수 있습니다."
      action={<Button label="서가로" variant="secondary" href="/resources" />} />
  </Page>;
}

export function createLibraryRouter(initialPath: string) {
  const root = createRootRoute({ component: Shell, errorComponent: RouteError, notFoundComponent: NotFound });
  const list = createRoute({ getParentRoute: () => root, path: '/resources', component: ListRoute, validateSearch: validateLibrarySearch });
  const home = createRoute({ getParentRoute: () => root, path: '/', component: ListRoute, validateSearch: validateLibrarySearch });
  const create = createRoute({ getParentRoute: () => root, path: '/resources/new', component: ComposeRoute });
  const detail = createRoute({ getParentRoute: () => root, path: '/resources/$id', component: DetailRoute });
  const edit = createRoute({ getParentRoute: () => root, path: '/resources/$id/edit', component: ComposeRoute });
  const settings = createRoute({ getParentRoute: () => root, path: '/settings', component: DisplaySettingsPage });
  return createRouter({
    routeTree: root.addChildren([home, list, create, detail, edit, settings]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    unmaskOnReload: true, defaultPreload: 'intent', scrollRestoration: true,
  });
}

/**
 * 서가 예제의 조립: 조회 캐시, 모의 저장소, 라우터보다 위의 초안 경계, 화면 설정(배치·밀도). Story마다 새로 만들며 메모리
 * 히스토리를 쓴다. 테마는 카탈로그 상단 도구가 정한다.
 */
export function LibraryApp({ api, initialPath = '/resources', initialLayout = 'inset' }: { api?: ResourceApi; initialPath?: string; initialLayout?: ShellLayout }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } }));
  const [repository] = useState(() => api ?? createResourceApi());
  const [layout, setLayout] = useState<ShellLayout>(initialLayout);
  const [density, setDensity] = useState<Density>('comfortable');
  const [router] = useState(() => createLibraryRouter(initialPath));
  return <QueryClientProvider client={client}>
    <ResourceApiContext value={repository}>
      <AppearanceContext value={{ layout, density, setLayout, setDensity }}>
        <DensityContext value={density}>
          <DraftProvider><RouterProvider router={router} /></DraftProvider>
        </DensityContext>
      </AppearanceContext>
    </ResourceApiContext>
  </QueryClientProvider>;
}
