import { Navigate, createRouter } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import { Route as AppRoute } from '@/pages/_app/route';
import { AppShellLayout } from '../layout/AppShellLayout';
import { routeTree } from './routeTree.gen';
import { isWorkItemViewChange } from './work-item-view-transition';

/**
 * 앱의 주소는 src/pages의 폴더가 정한다(TanStack 파일 라우팅, 만든 트리는 routeTree.gen.ts). 폴더 하나가 주소 한 단계이고,
 * page.tsx가 그 주소의 화면, route.tsx가 그 아래 전부에 걸리는 틀(권한 확인 · 먼저 읽기), index.ts가 다른 층이 쓰는 공개 진입점이다.
 * 로그인한 사람의 틀 화면(사이드바 · 패널)은 app 층의 것이라 여기서 붙인다. pages는 app을 가져오지 않는다.
 */
AppRoute.update({ component: AppShellLayout });

export const createAppRouter = (queryClient: QueryClient) => createRouter({
  routeTree, context: { queryClient }, defaultPreload: 'intent', defaultPreloadStaleTime: 0,
  // 다음 경로가 준비될 때까지 기존 화면을 유지하고, 오래 걸리면 RouteStage가 상단 진행 막대를 띄운다.
  defaultPendingMs: Infinity,
  defaultGcTime: 0,
  // 준비된 화면끼리 콘텐츠 영역만 200ms 교차 페이드한다(app/styles의 cowork-content). 가리는 판이 없으므로 모든 이동에 같은
  // 규칙을 쓴다. 라우터는 데이터 준비(loader)가 끝난 뒤에 전환을 시작하므로, 준비하는 동안은 진행 표시가 그대로 움직인다.
  // 로그인 오가기, 동작 줄이기 설정, 이미 진행 중인 전환(빠른 연속 이동), 열린 대화상자 위에서는 하지 않는다.
  defaultViewTransition: typeof CSS !== 'undefined' && CSS.supports('selector(:active-view-transition-type(cowork-content))') && {
    types: ({ fromLocation, toLocation, pathChanged }) => {
      if (!fromLocation || (!pathChanged && !isWorkItemViewChange(fromLocation, toLocation))
        || [fromLocation.pathname, toLocation.pathname].some(path => path === '/login' || path === '/onboarding')
        || matchMedia('(prefers-reduced-motion: reduce)').matches
        || document.documentElement.matches(':active-view-transition')
        || document.querySelector('dialog[open], [role="dialog"][data-open], [role="alertdialog"][data-open]')) return false;
      return ['cowork-content'];
    },
  },
  // A panel's masked address (shared/lib/panel) opens as its own page on a reload.
  unmaskOnReload: true,
  defaultNotFoundComponent: () => <Navigate to="/" replace />,
});
