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
import { FolderApiContext, type FolderApi } from '../entities/node';
import { createFolderApi } from '../mocks/folder-api';
import { FoldersPage } from '../pages/folders/FoldersPage';

const space: NavSpace = {
  id: 'main', title: '폴더', sections: [
    { title: '폴더', isHeaderHidden: true, entries: [{ path: '/folders', label: '폴더', icon: 'folder' }] },
  ],
};

function Shell() {
  const layout = useShellLayout();
  const location = useLocation();
  const navigate = useNavigate();
  return <LinkProvider component={RouterLink}>
    <AppFrame space={space} pathname={location.pathname} layout={layout} onNavigate={path => void navigate({ href: path })}
      brand={isFolded => <HStack gap={2} vAlign="center">{icon('folder', true)}{isFolded ? null : <Text weight="semibold">폴더</Text>}</HStack>}>
      <Outlet />
    </AppFrame>
  </LinkProvider>;
}

function RouteError({ reset }: ErrorComponentProps) {
  return <Page crumbs={[{ label: '폴더' }]}>
    <PageState kind="error" title="화면을 열 수 없습니다" description="잠시 후 다시 시도해 주세요." action={<Button label="다시 시도" variant="secondary" onClick={reset} />} />
  </Page>;
}

export function createFoldersRouter(initialPath: string) {
  const root = createRootRoute({ component: Shell, errorComponent: RouteError });
  const home = createRoute({ getParentRoute: () => root, path: '/folders', component: FoldersPage });
  const folder = createRoute({ getParentRoute: () => root, path: '/folders/$id', component: FoldersPage });
  return createRouter({ routeTree: root.addChildren([home, folder]), history: createMemoryHistory({ initialEntries: [initialPath] }) });
}

/** 폴더 탐색 예제의 조립: 조회 캐시, 모의 저장소, 메모리 히스토리 라우터. 견본마다 새로 만든다. */
export function FoldersApp({ api, initialPath = '/folders' }: { api?: FolderApi; initialPath?: string }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } }));
  const [repository] = useState(() => api ?? createFolderApi());
  const [router] = useState(() => createFoldersRouter(initialPath));
  return <QueryClientProvider client={client}>
    <FolderApiContext value={repository}><RouterProvider router={router} /></FolderApiContext>
  </QueryClientProvider>;
}
