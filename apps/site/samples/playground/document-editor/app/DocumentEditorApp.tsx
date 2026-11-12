import type { NavSpace } from '@/shared/ui/app-shell';
import { FileTextIcon } from '@/shared/ui/icon';
import { PlaygroundShell } from '@samples/playground/PlaygroundShell';
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider, useLocation } from '@tanstack/react-router';
import { useState } from 'react';
import { useShellLayout } from '../../../catalog/shell-layout';
import { DocumentEditPage } from '../pages/DocumentEditPage';
import { DocumentReadPage } from '../pages/DocumentReadPage';
import { DocumentStoreProvider } from './store';

const space: NavSpace = {
  id: 'main', title: '문서', sections: [{ title: '문서', isHeaderHidden: true, entries: [{ path: '/documents/spec', label: '시스템 정의서', icon: FileTextIcon }] }],
};

function Shell() {
  const layout = useShellLayout();
  const location = useLocation();
  return (
    <PlaygroundShell space={space} pathname={location.pathname} layout={layout}
      brand={isFolded => <span className="flex min-w-0 items-center gap-2"><FileTextIcon chosen className="size-5 shrink-0" />{isFolded ? null : <span className="truncate font-semibold">문서 편집기</span>}</span>}
      footer={isFolded => (isFolded ? null : <span className="px-2 text-xs text-muted-foreground">예제 · 메모리 저장</span>)}>
      <Outlet />
    </PlaygroundShell>
  );
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
