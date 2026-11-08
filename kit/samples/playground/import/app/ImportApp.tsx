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
import { CustomerApiContext, type CustomerApi } from '../entities/customer';
import { createCustomerApi } from '../mocks/customer-api';
import { CustomersPage } from '../pages/customers/CustomersPage';
import { ImportPage } from '../pages/import/ImportPage';
import { ImportSessionProvider, type ImportPreset } from './session';

const space: NavSpace = {
  id: 'main', title: '고객', sections: [
    { title: '고객', isHeaderHidden: true, entries: [{ path: '/customers', label: '고객', icon: 'people' }] },
  ],
};

function Shell() {
  const layout = useShellLayout();
  const location = useLocation();
  const navigate = useNavigate();
  return <LinkProvider component={RouterLink}>
    <AppFrame space={space} pathname={location.pathname} layout={layout} isSelected={path => path === '/customers'}
      onNavigate={path => void navigate({ href: path })}
      brand={isFolded => <HStack gap={2} vAlign="center">{icon('people', true)}{isFolded ? null : <Text weight="semibold">고객</Text>}</HStack>}>
      <Outlet />
    </AppFrame>
  </LinkProvider>;
}

function RouteError({ reset }: ErrorComponentProps) {
  return <Page crumbs={[{ label: '고객' }]}>
    <PageState kind="error" title="화면을 열 수 없습니다" description="잠시 후 다시 시도해 주세요." action={<Button label="다시 시도" variant="secondary" onClick={reset} />} />
  </Page>;
}

export function createImportRouter(initialPath: string) {
  const root = createRootRoute({ component: Shell, errorComponent: RouteError });
  const paths = ['/customers', '/import', '/import/$step'] as const;
  const routes = paths.map(path => createRoute({ getParentRoute: () => root, path, component: path === '/customers' ? CustomersPage : ImportPage }));
  const home = createRoute({ getParentRoute: () => root, path: '/', component: CustomersPage });
  return createRouter({ routeTree: root.addChildren([home, ...routes]), history: createMemoryHistory({ initialEntries: [initialPath] }) });
}

/**
 * 가져오기 예제의 조립: 조회 캐시, 모의 저장소, 가져오기 작업 상태, 메모리 히스토리 라우터. 견본마다 새로 만든다. preset은 견본이
 * 단계 중간(파일을 올린 뒤, 가져오기를 마친 뒤)에서 시작할 때 쓴다.
 */
export function ImportApp({ api, initialPath = '/customers', preset }: { api?: CustomerApi; initialPath?: string; preset?: ImportPreset }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } }));
  const [repository] = useState(() => api ?? createCustomerApi());
  const [router] = useState(() => createImportRouter(initialPath));
  return <QueryClientProvider client={client}>
    <CustomerApiContext value={repository}>
      <ImportSessionProvider preset={preset}><RouterProvider router={router} /></ImportSessionProvider>
    </CustomerApiContext>
  </QueryClientProvider>;
}
