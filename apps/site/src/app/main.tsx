import '@/app/styles/tailwind.css';
import '@/app/styles/site.css';
import { createRootRoute, createRoute, createRouter, redirect, RouterProvider } from '@tanstack/react-router';
import { createRoot } from 'react-dom/client';
import { docAt, firstOf, loadDoc } from '@/entities/document';
import { BlogPage } from '@/pages/blog';
import { DocPage } from '@/pages/document';
import { SettingsPage } from '@/pages/settings';
import { prepareDiagrams } from '@/shared/markdown/Diagram';
import { prepareSamples } from '@/widgets/samples';
import { SiteApp } from './providers';

/** 주소의 문서를 찾아 본문을 불러온다. 묶음 주소(/app-shell/ 등)는 그 묶음의 첫 문서로 보낸다. */
async function load(pathname: string) {
  const path = pathname.endsWith('/') ? pathname : `${pathname}/`;
  if (path === '/') throw redirect({ href: '/blog/', replace: true } as never);
  if (path.startsWith('/posts/')) throw redirect({ href: path.replace('/posts/', '/blog/'), replace: true } as never);
  if (path === '/settings/') throw redirect({ href: '/settings/appearance/', replace: true } as never);
  if (['/settings/appearance/', '/settings/plugins/'].includes(path)) return { doc: null, Content: SettingsPage };
  if (!path.startsWith('/blog/') && !path.startsWith('/webcraft/')) {
    const next = `/webcraft${path.replace('/webcraft-mode/', '/goraebap-mode/')}`;
    throw redirect({ href: next, replace: true } as never);
  }
  if (path === '/blog/') return { doc: null, Content: BlogPage };
  if (path.includes('/rules/webcraft-mode/')) throw redirect({ href: path.replace('/webcraft-mode/', '/goraebap-mode/'), replace: true } as never);
  const doc = docAt(path);
  if (!doc) {
    const first = firstOf(path);
    // 주소는 문서 목록에서 만든 문자열이라 라우트 타입으로 좁히지 않는다.
    if (first) throw redirect({ href: first, replace: true } as never);
    return { doc: null, Content: null };
  }
  // 본문 코드와 함께 견본 정보와 도표 그림을 준비한다. 새 문서는 처음부터 제 높이로 그려지고 뒤늦게 밀리지 않는다.
  const [Content] = await Promise.all([loadDoc(doc), prepareSamples(doc.samples ?? []), prepareDiagrams(doc.diagrams ?? [])]);
  return { doc, Content };
}

const loader = ({ location }: { location: { pathname: string } }) => load(location.pathname);
const view = (data: Awaited<ReturnType<typeof load>>) => data.Content === SettingsPage ? <SettingsPage /> : data.Content === BlogPage ? <BlogPage /> : <DocPage key={data.doc?.path ?? 'missing'} doc={data.doc} Content={data.Content} />;

const rootRoute = createRootRoute({ component: SiteApp });
// 라우트마다 자기 데이터를 읽는다(다른 라우트의 useLoaderData를 쓰면 라우터가 멈춘다).
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', loader, component: () => view(indexRoute.useLoaderData()) });
const docRoute = createRoute({ getParentRoute: () => rootRoute, path: '$', loader, component: () => view(docRoute.useLoaderData()) });

const router = createRouter({
  routeTree: rootRoute.addChildren([indexRoute, docRoute]),
  trailingSlash: 'always',
  defaultPreload: 'intent',
  // 다음 문서가 준비될 때까지 지금 문서를 그대로 둔다. 진행 표시는 셸이 150ms 뒤에 띄운다.
  defaultPendingMs: Infinity,
  // 준비된 문서끼리는 콘텐츠 영역만 교차 페이드한다(업무 앱과 같은 규칙). 라우터는 loader가 끝난 뒤 전환을 시작하므로
  // 준비하는 동안 진행 표시가 멈추지 않는다. 동작 줄이기 설정, 진행 중인 전환, 열린 창(문서 찾기 · 더보기 시트 · 크게 보기) 위에서는 하지 않는다.
  defaultViewTransition: typeof CSS !== 'undefined' && CSS.supports('selector(:active-view-transition-type(guide-content))') && {
    types: ({ fromLocation, pathChanged }) => {
      if (!fromLocation || !pathChanged || matchMedia('(prefers-reduced-motion: reduce)').matches
        || document.documentElement.matches(':active-view-transition') || document.querySelector('[role=dialog], dialog[open], .yarl__portal_open')) return false;
      return ['guide-content'];
    },
  },
});

declare module '@tanstack/react-router' { interface Register { router: typeof router } }

createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
