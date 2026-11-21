import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';

/** 앱의 뿌리 라우트. 라우트마다 조회 캐시(queryClient)를 맥락으로 받는다. */
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: () => <Outlet />,
});
