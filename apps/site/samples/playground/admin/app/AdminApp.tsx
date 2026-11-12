import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Link, Outlet, RouterProvider, useLocation, useNavigate,
  type ErrorComponentProps } from '@tanstack/react-router';
import { useState } from 'react';
import type { NavSpace } from '@/shared/ui/app-shell';
import { Button } from '@/shared/ui/button';
import { SettingsIcon, ShieldCheckIcon, TagIcon, UsersIcon } from '@/shared/ui/icon';
import { Page } from '@/shared/ui/page';
import { PageState } from '@/shared/ui/page-state';
import { PlaygroundShell } from '@samples/playground/PlaygroundShell';
import { useShellLayout } from '../../../catalog/shell-layout';
import { AdminApiContext, type AdminApi } from '../entities/admin';
import { createAdminApi } from '../mocks/admin-api';
import { PermissionsPage } from '../pages/permissions/PermissionsPage';
import { TagsPage } from '../pages/tags/TagsPage';
import { validateUsersSearch } from '../pages/users/model';
import { InviteDialog } from '../pages/users/UserDialogs';
import { UsersPage } from '../pages/users/UsersPage';
import { PresetContext, type Preset } from './preset';

const space: NavSpace = {
  id: 'main', title: '관리', sections: [
    { title: '관리', isHeaderHidden: true, entries: [
      { path: '/tags', label: '태그', icon: TagIcon },
      { path: '/users', label: '사용자', icon: UsersIcon },
      { path: '/permissions', label: '권한', icon: ShieldCheckIcon },
    ] },
  ],
};

/** 셸: 주소가 메뉴의 현재 항목을 정한다. 로고는 처음(태그)으로 가는 링크다. */
function Shell() {
  const layout = useShellLayout();
  const location = useLocation();
  return <PlaygroundShell space={space} pathname={location.pathname} layout={layout}
    brand={isFolded => <Link to={'/tags' as string} aria-label="관리 처음으로"
      className="flex min-w-0 items-center gap-2 rounded-md px-1 font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      <SettingsIcon chosen className="size-5 shrink-0" />{isFolded ? null : <span className="truncate">관리</span>}
    </Link>}>
    <Outlet />
  </PlaygroundShell>;
}

function RouteError({ reset }: ErrorComponentProps) {
  return <Page crumbs={[{ label: '관리', icon: SettingsIcon }]}>
    <PageState kind="error" title="화면을 열 수 없습니다" description="잠시 후 다시 시도해 주세요." action={<Button variant="secondary" onClick={reset}>다시 시도</Button>} />
  </Page>;
}

function NotFound() {
  return <Page crumbs={[{ label: '관리', href: '/tags', icon: SettingsIcon }, { label: '없는 페이지' }]} isFullScreen>
    <PageState kind="not-found" title="페이지를 찾을 수 없습니다" description="주소가 바뀌었거나 지워졌을 수 있습니다."
      action={<Button variant="secondary" nativeButton={false} render={<Link to={'/tags' as string} />}>태그로</Button>} />
  </Page>;
}

/** 초대 페이지(/users/invite): 링크 · 새로고침 · 크게 보기 · 휴대폰이 여는 자기 주소의 양식. */
function InviteRoute() {
  const navigate = useNavigate();
  return <InviteDialog surface="page" onClose={() => void navigate({ href: '/users' })} />;
}

const validateTagsSearch = (raw: Record<string, unknown>) => ({
  ...raw, q: typeof raw.q === 'string' && raw.q ? raw.q : undefined, edit: typeof raw.edit === 'string' && raw.edit ? raw.edit : undefined,
});

export function createAdminRouter(initialPath: string) {
  const root = createRootRoute({ component: Shell, errorComponent: RouteError, notFoundComponent: NotFound });
  const tags = createRoute({ getParentRoute: () => root, path: '/tags', component: TagsPage, validateSearch: validateTagsSearch });
  const home = createRoute({ getParentRoute: () => root, path: '/', component: TagsPage, validateSearch: validateTagsSearch });
  const users = createRoute({ getParentRoute: () => root, path: '/users', component: UsersPage, validateSearch: validateUsersSearch });
  const permissions = createRoute({ getParentRoute: () => root, path: '/permissions', component: PermissionsPage });
  const invite = createRoute({ getParentRoute: () => root, path: '/users/invite', component: InviteRoute });
  return createRouter({
    routeTree: root.addChildren([home, tags, users, permissions, invite]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    unmaskOnReload: true, defaultPreload: 'intent', scrollRestoration: true,
  });
}

/**
 * 관리 앱의 조립: 조회 캐시, 모의 저장소, 라우터. 견본마다 새로 만들며 메모리 히스토리를 쓴다. 배치(Inset · Split)는
 * 가이드 머리 줄의 전환을 셸이 따른다.
 */
export function AdminApp({ api, initialPath = '/tags', preset = {} }: { api?: AdminApi; initialPath?: string; preset?: Preset }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } }));
  const [repository] = useState(() => api ?? createAdminApi());
  const [router] = useState(() => createAdminRouter(initialPath));
  return <QueryClientProvider client={client}>
    <AdminApiContext value={repository}>
      <PresetContext value={preset}><RouterProvider router={router} /></PresetContext>
    </AdminApiContext>
  </QueryClientProvider>;
}
