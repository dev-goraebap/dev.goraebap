import { HStack } from '@astryxdesign/core/HStack';
import { LinkProvider } from '@astryxdesign/core/Link';
import { Text } from '@astryxdesign/core/Text';
import { icon } from '@/shared/ui/foundations/icons/solar-icon';
import type { NavSpace } from '@/shared/ui/layouts/app/nav';
import { RouterLink } from '@/shared/ui/patterns/routing/RouterLink';
import { PlaygroundFrame as AppFrame } from '@samples/playground/PlaygroundFrame';
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider, useLocation, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useShellLayout } from '../../../catalog/shell-layout';
import { DocumentEditPage } from '../pages/DocumentEditPage';
import { DocumentReadPage } from '../pages/DocumentReadPage';
import { DocumentStoreProvider } from './store';

const space: NavSpace = {
  id: 'main', title: '문서', sections: [{ title: '문서', isHeaderHidden: true, entries: [{ path: '/documents/spec', label: '시스템 정의서', icon: 'document' }] }],
};

function Shell() {
  const layout = useShellLayout();
  const location = useLocation();
  const navigate = useNavigate();
  return <LinkProvider component={RouterLink}>
    <AppFrame space={space} pathname={location.pathname} layout={layout} onNavigate={path => void navigate({ href: path })}
      brand={isFolded => <HStack gap={2} vAlign="center" paddingInline={2}>{icon('document', true)}{isFolded ? null : <Text weight="semibold">문서 편집기</Text>}</HStack>}
      footer={<HStack width="100%" paddingInline={2}><Text type="supporting" color="secondary">예제 · 메모리 저장</Text></HStack>}>
      <Outlet />
    </AppFrame>
  </LinkProvider>;
}

function createDocumentRouter(initialPath: string) {
  const root = createRootRoute({ component: Shell });
  const read = createRoute({ getParentRoute: () => root, path: '/documents/spec', component: DocumentReadPage });
  const edit = createRoute({ getParentRoute: () => root, path: '/documents/spec/edit', component: DocumentEditPage });
  return createRouter({ routeTree: root.addChildren([read, edit]), history: createMemoryHistory({ initialEntries: [initialPath] }), scrollRestoration: false });
}

/** 문서 편집기 앱: 정의서 하나를 페이지 / 페이지 없음으로 읽고 쓴다(메모리 저장). */
export function DocumentEditorApp({ initialPath = '/documents/spec' }: { initialPath?: string }) {
  const [router] = useState(() => createDocumentRouter(initialPath));
  return <DocumentStoreProvider><RouterProvider router={router} /></DocumentStoreProvider>;
}
