import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import './app/app.css';
import { LinkProvider } from '@astryxdesign/core/Link';
import { Theme } from '@astryxdesign/core/theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRootRoute, createRoute, createRouter, redirect, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterLink } from './app/RouterLink';
import { Shell } from './app/Shell';
import { defaultThemeSlug, themes } from './astryx-themes';
import Board from './pages/kanban-board/page';
import Settings from './pages/settings/page';
import Table from './pages/table-filter/page';
import Inbox from './pages/table-inbox/page';

const root = createRootRoute({ component: Shell });
const page = (path: string, component: () => React.ReactNode) => createRoute({ getParentRoute: () => root, path, component });
const routes = [
  createRoute({ getParentRoute: () => root, path: '/', beforeLoad: () => { throw redirect({ to: '/inbox' }); } }),
  page('/inbox', Inbox), page('/table', Table), page('/board', Board), page('/settings', Settings),
];
const router = createRouter({ routeTree: root.addChildren(routes) });
const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Theme theme={themes[defaultThemeSlug]}>
        <LinkProvider component={RouterLink}>
          <RouterProvider router={router} />
        </LinkProvider>
      </Theme>
    </QueryClientProvider>
  </StrictMode>,
);
