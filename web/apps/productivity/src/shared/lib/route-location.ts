import { useRouterState } from '@tanstack/react-router';

/** Follow the rendered match, including the commit before onResolved, rather than only the router status. */
export function usePageLocation() {
  return useRouterState({ select: state =>
    state.status !== 'pending' || (state.matches.at(-1)?.pathname === state.location.pathname
      && JSON.stringify(state.matches.at(-1)?.search) === JSON.stringify(state.location.search))
      ? state.location
      : state.resolvedLocation ?? state.location });
}

/** 지금 준비 중인 이동의 목적지 경로(없으면 undefined). 누른 메뉴의 선택 표시를 응답 전에 옮길 때 쓴다. */
export function usePendingPathname() {
  return useRouterState({ select: state => state.status === 'pending' && state.resolvedLocation
    && state.location.pathname !== state.resolvedLocation.pathname ? state.location.pathname : undefined });
}

/**
 * 주소가 딱 path인가(끝의 /는 보지 않는다). 아래 주소 전부에 걸리는 라우트(route.tsx)가 "그 폴더 주소 자체"일 때만 할
 * 일(첫 화면으로 보내기)을 가를 때 쓴다.
 */
export const isExactly = (pathname: string, path: string) => (pathname.replace(/\/+$/, '') || '/') === path;
