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
