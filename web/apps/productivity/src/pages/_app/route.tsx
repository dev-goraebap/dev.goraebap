import { createFileRoute, redirect } from '@tanstack/react-router';
import { sessionOptions } from '@/shared/auth';

/**
 * 로그인한 사람의 앱 틀: 주소에 나타나지 않는 단계. 로그인하지 않았으면 로그인으로, 온보딩 전이면 환영으로 보낸다.
 * 틀 화면(사이드바 · 패널)은 app 층이 router.tsx에서 붙인다. pages는 app을 가져오지 않는다.
 */
export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.query({ ...sessionOptions(), staleTime: 'static' });
    if (!session) throw redirect({ to: '/login' });
    if (!session.onboarded) throw redirect({ href: '/onboarding', replace: true });
    return { session };
  },
});
