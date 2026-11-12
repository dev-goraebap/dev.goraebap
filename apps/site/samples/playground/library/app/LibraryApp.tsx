import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Link, Outlet, RouterProvider, useLocation, useNavigate, useParams,
  type ErrorComponentProps } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { usePanel, useOpenPanel } from '@/shared/lib/panel';
import type { NavEntry, NavSpace, ShellLayout } from '@/shared/ui/app-shell';
import { Button } from '@/shared/ui/button';
import { FolderIcon, LibraryIcon, SettingsIcon, StarIcon } from '@/shared/ui/icon';
import { Page } from '@/shared/ui/page';
import { PageState } from '@/shared/ui/page-state';
import { PlaygroundShell } from '@samples/playground/PlaygroundShell';
import { useShellLayout } from '../../../catalog/shell-layout';
import { collections, ResourceApiContext, type ResourceApi } from '../entities/resource';
import { createResourceApi } from '../mocks/resource-api';
import { LibraryPage } from '../pages/library/LibraryPage';
import { validateLibrarySearch } from '../pages/library/model';
import { ResourceCompose } from '../pages/resource-compose/ResourceCompose';
import { ResourceDetailPage } from '../pages/resource-detail/ResourceDetailPage';
import { ResourceEditPage } from '../pages/resource-edit/ResourceEditPage';
import { DisplaySettingsPage } from '../pages/settings/DisplaySettingsPage';
import { AppearanceContext, useAppearance, type Density } from './appearance';

/**
 * 메뉴. 즐겨찾기 · 컬렉션은 같은 목록의 검색 조건이라 주소만으로 지금 자리를 가릴 수 없다. 그래서 지금 주소의 조건을 보고
 * 항목마다 isCurrent를 정한다(상세 · 수정은 그 자료가 속한 목록이 아니라 '모든 자료'에 둔다).
 */
function spaceOf(pathname: string, search: Record<string, unknown>): NavSpace {
  const inList = pathname === '/' || pathname.startsWith('/resources');
  const list = (label: string, icon: NavEntry['icon'], condition?: Record<string, string>): NavEntry => ({
    path: '/resources', search: condition, label, icon,
    isCurrent: inList && (condition ? Object.entries(condition).every(([key, value]) => String(search[key]) === value) : !search.collection && !search.starred),
  });
  return {
    id: 'main', title: '서가', sections: [
      { title: '서가', isHeaderHidden: true, entries: [list('모든 자료', LibraryIcon), list('즐겨찾기', StarIcon, { starred: 'true' })] },
      { title: '컬렉션', entries: collections.map(each => list(each.name, FolderIcon, { collection: each.id })) },
      { title: '설정', entries: [{ path: '/settings', label: '화면 설정', icon: SettingsIcon, isCurrent: pathname === '/settings' }] },
    ],
  };
}

/** 셸: 주소가 메뉴의 현재 항목을 정한다. 로고는 처음(모든 자료)으로 가는 링크다. */
function Shell() {
  const { layout } = useAppearance();
  const location = useLocation();
  return <PlaygroundShell space={spaceOf(location.pathname, location.search as Record<string, unknown>)} pathname={location.pathname} layout={layout}
    brand={isFolded => <Link to={"/resources" as string} aria-label="서가 처음으로"
      className="flex min-w-0 items-center gap-2 rounded-md px-1 font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      <LibraryIcon chosen className="size-5 shrink-0" />{isFolded ? null : <span className="truncate">서가</span>}
    </Link>}
    footer={isFolded => (isFolded ? null : <span className="px-1 tabular-nums">예제 · 메모리 저장</span>)}>
    <Outlet />
  </PlaygroundShell>;
}

/** 목록과 목록 위의 작성 대화상자(?panel). 휴대폰 폭에서 ?panel이 남아 있으면 키트의 usePanel이 그 페이지로 옮긴다. */
function ListRoute() {
  const open = useOpenPanel();
  const panel = usePanel();
  return <>
    <LibraryPage onCreate={() => open('/resources/new')} />
    {panel.href === '/resources/new'
      ? <ResourceCompose key={panel.href} surface="dialog" onClose={panel.close} onExpand={panel.expand} onDone={id => panel.done(`/resources/${id}`)} />
      : null}
  </>;
}

function DetailRoute() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  return <ResourceDetailPage id={id} onEdit={() => void navigate({ href: `/resources/${id}/edit` })} onDeleted={() => void navigate({ href: '/resources', replace: true })} />;
}

/** 수정 화면: 상세의 편집 단추가 늘 이곳을 연다. 끝나면(완료 · 취소) 상세로 돌아간다. */
function EditRoute() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  return <ResourceEditPage id={id} onLeave={() => void navigate({ href: `/resources/${id}` })} />;
}

/** 작성 페이지(/resources/new): 링크 · 새로고침 · 크게 보기 · 휴대폰이 여는 자기 주소의 양식. */
function ComposeRoute() {
  const navigate = useNavigate();
  return <ResourceCompose surface="page" onClose={() => void navigate({ href: '/resources' })}
    onDone={next => void navigate({ href: `/resources/${next}`, replace: true })} />;
}

function RouteError({ reset }: ErrorComponentProps) {
  return <Page crumbs={[{ label: '서가', icon: LibraryIcon }]}>
    <PageState kind="error" title="화면을 열 수 없습니다" description="잠시 후 다시 시도해 주세요." action={<Button variant="secondary" onClick={reset}>다시 시도</Button>} />
  </Page>;
}

function NotFound() {
  return <Page crumbs={[{ label: '서가', href: '/resources', icon: LibraryIcon }, { label: '없는 페이지' }]} isFullScreen>
    <PageState kind="not-found" title="페이지를 찾을 수 없습니다" description="주소가 바뀌었거나 지워졌을 수 있습니다."
      action={<Button variant="secondary" nativeButton={false} render={<Link to={"/resources" as string} />}>서가로</Button>} />
  </Page>;
}

export function createLibraryRouter(initialPath: string) {
  const root = createRootRoute({ component: Shell, errorComponent: RouteError, notFoundComponent: NotFound });
  const list = createRoute({ getParentRoute: () => root, path: '/resources', component: ListRoute, validateSearch: validateLibrarySearch });
  const home = createRoute({ getParentRoute: () => root, path: '/', component: ListRoute, validateSearch: validateLibrarySearch });
  const create = createRoute({ getParentRoute: () => root, path: '/resources/new', component: ComposeRoute });
  const detail = createRoute({ getParentRoute: () => root, path: '/resources/$id', component: DetailRoute });
  const edit = createRoute({ getParentRoute: () => root, path: '/resources/$id/edit', component: EditRoute });
  const settings = createRoute({ getParentRoute: () => root, path: '/settings', component: DisplaySettingsPage });
  return createRouter({
    routeTree: root.addChildren([home, list, create, detail, edit, settings]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    unmaskOnReload: true, defaultPreload: 'intent', scrollRestoration: true,
  });
}

/**
 * 서가 예제의 조립: 조회 캐시, 모의 저장소, 화면 설정(배치 · 밀도). 견본마다 새로
 * 만들며 메모리 히스토리를 쓴다. 테마는 가이드 상단 도구가 정한다. 밀도는 감싸개의 data-density로 키트의 compact: 변형에 닿는다
 * (사이트 화면 설정은 html에 두지만, 견본 하나의 설정이 가이드 전체를 바꾸지 않도록 이 앱 안에만 둔다).
 */
export function LibraryApp({ api, initialPath = '/resources', initialLayout }: { api?: ResourceApi; initialPath?: string; initialLayout?: ShellLayout }) {
  // 배치는 가이드 머리 줄의 전환을 따른다. 예제 안의 화면 설정에서 바꾸면 그 값이 이긴다.
  const guideLayout = useShellLayout();
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } }));
  const [repository] = useState(() => api ?? createResourceApi());
  const [chosenLayout, setLayout] = useState<ShellLayout | undefined>(initialLayout);
  useEffect(() => setLayout(initialLayout), [guideLayout, initialLayout]);
  const layout = chosenLayout ?? guideLayout;
  const [density, setDensity] = useState<Density>('spacious');
  const [router] = useState(() => createLibraryRouter(initialPath));
  return <QueryClientProvider client={client}>
    <ResourceApiContext value={repository}>
      <AppearanceContext value={{ layout, density, setLayout, setDensity }}>
        <div data-density={density} className="contents">
          <RouterProvider router={router} />
        </div>
      </AppearanceContext>
    </ResourceApiContext>
  </QueryClientProvider>;
}
