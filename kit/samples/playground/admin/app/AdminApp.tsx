import { DraftProvider } from '@kit/patterns/compose/draft-store';
import {InviteDialog} from '../pages/users/UserDialogs';
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
import { AdminApiContext, type AdminApi } from '../entities/admin';
import { createAdminApi } from '../mocks/admin-api';
import { PermissionsPage } from '../pages/permissions/PermissionsPage';
import { TagsPage } from '../pages/tags/TagsPage';
import { UsersPage } from '../pages/users/UsersPage';
import { validateUsersSearch } from '../pages/users/model';
import { PresetContext, type Preset } from './preset';
import styles from './app.module.css';

const space: NavSpace = {
  id: 'main', title: '관리', sections: [
    { title: '관리', isHeaderHidden: true, entries: [
      { path: '/tags', label: '태그', icon: 'tag' },
      { path: '/users', label: '사용자', icon: 'people' },
      { path: '/permissions', label: '권한', icon: 'shield' },
    ] },
  ],
};

/** 셸: 주소가 메뉴의 현재 항목을 정한다. */
function Shell() {
  const layout = useShellLayout();
  const location = useLocation();
  const navigate = useNavigate();
  return <LinkProvider component={RouterLink}>
    <AppFrame space={space} pathname={location.pathname} layout={layout} onNavigate={path => void navigate({ href: path })}
      brand={isFolded => <a className={styles.brand} href="/tags" aria-label="관리 처음으로" onClick={event => { event.preventDefault(); void navigate({ href: '/tags' }); }}>
        <HStack gap={2} vAlign="center">{icon('settings', true)}{isFolded ? null : <Text weight="semibold">관리</Text>}</HStack>
      </a>}>
      <Outlet />
    </AppFrame>
  </LinkProvider>;
}

function RouteError({ reset }: ErrorComponentProps) {
  return <Page crumbs={[{ label: '관리' }]}>
    <PageState kind="error" title="화면을 열 수 없습니다" description="잠시 후 다시 시도해 주세요." action={<Button label="다시 시도" variant="secondary" onClick={reset} />} />
  </Page>;
}

function NotFound() {
  return <Page crumbs={[{ label: '관리', href: '/tags' }, { label: '없는 페이지' }]} isDetail>
    <PageState kind="not-found" title="페이지를 찾을 수 없습니다" description="주소가 바뀌었거나 지워졌을 수 있습니다."
      action={<Button label="태그로" variant="secondary" href="/tags" />} />
  </Page>;
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
  const invite=createRoute({getParentRoute:()=>root,path:'/users/invite',component:function(){const navigate=useNavigate();return <InviteDialog surface="page" onClose={()=>void navigate({href:'/users'})}/>}});
  return createRouter({unmaskOnReload:true,
    routeTree: root.addChildren([home, tags, users, permissions,invite]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    defaultPreload: 'intent', scrollRestoration: true,
  });
}

/**
 * 관리 앱의 조립: 조회 캐시, 모의 저장소, 라우터. 견본마다 새로 만들며 메모리 히스토리를 쓴다. 배치(Inset·Split)는
 * 가이드 머리 줄의 전환을 셸이 따른다.
 */
export function AdminApp({ api, initialPath = '/tags', preset = {} }: { api?: AdminApi; initialPath?: string; preset?: Preset }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } }));
  const [repository] = useState(() => api ?? createAdminApi());
  const [router] = useState(() => createAdminRouter(initialPath));
  return <QueryClientProvider client={client}>
    <AdminApiContext value={repository}>
      <PresetContext value={preset}><DraftProvider><RouterProvider router={router} /></DraftProvider></PresetContext>
    </AdminApiContext>
  </QueryClientProvider>;
}
