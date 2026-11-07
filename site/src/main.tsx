import '@kit/foundations/base.css';
import './styles/samples.css';
import { createRootRoute, createRoute, createRouter, redirect, RouterProvider } from '@tanstack/react-router';
import { createRoot } from 'react-dom/client';
import { docAt, firstOf, loadDoc } from './docs';
import { DocPage } from './guide/DocPage';
import { GuideShell } from './guide/GuideShell';

/** 주소의 문서를 찾아 본문을 불러온다. 묶음 주소(/app-shell/ 등)는 그 묶음의 첫 문서로 보낸다. */
async function load(pathname: string) {
  const path = pathname.endsWith('/') ? pathname : `${pathname}/`;
  const doc = docAt(path);
  if (!doc) {
    const first = firstOf(path);
    // 주소는 문서 목록에서 만든 문자열이라 라우트 타입으로 좁히지 않는다.
    if (first) throw redirect({ href: first, replace: true } as never);
    return { doc: null, Content: null };
  }
  return { doc, Content: await loadDoc(doc) };
}

const loader = ({ location }: { location: { pathname: string } }) => load(location.pathname);
const view = (data: Awaited<ReturnType<typeof load>>) => <DocPage key={data.doc?.path ?? 'missing'} doc={data.doc} Content={data.Content} />;

const rootRoute = createRootRoute({ component: GuideShell });
// 라우트마다 자기 데이터를 읽는다(다른 라우트의 useLoaderData를 쓰면 라우터가 멈춘다).
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', loader, component: () => view(indexRoute.useLoaderData()) });
const docRoute = createRoute({ getParentRoute: () => rootRoute, path: '$', loader, component: () => view(docRoute.useLoaderData()) });

const router = createRouter({
  routeTree: rootRoute.addChildren([indexRoute, docRoute]),
  trailingSlash: 'always',
  defaultPreload: 'intent',
  // 다음 문서가 준비될 때까지 지금 문서를 그대로 둔다. 덮개는 셸이 180ms 뒤에 씌운다.
  defaultPendingMs: Infinity,
  defaultViewTransition: !matchMedia('(prefers-reduced-motion: reduce)').matches,
});

// 문서를 옮기면 본문을 맨 위에서(주소에 #이 있으면 그 제목에서) 보인다. 본문은 페이지 안에서 스크롤한다.
router.subscribe('onResolved', ({ pathChanged }) => {
  if (!pathChanged) return;
  requestAnimationFrame(() => {
    const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
    if (target) { target.scrollIntoView(); return; }
    let node = document.querySelector('article')?.parentElement ?? null;
    while (node && !/(auto|scroll)/.test(getComputedStyle(node).overflowY)) node = node.parentElement;
    if (node) node.scrollTop = 0;
  });
});

declare module '@tanstack/react-router' { interface Register { router: typeof router } }

createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
