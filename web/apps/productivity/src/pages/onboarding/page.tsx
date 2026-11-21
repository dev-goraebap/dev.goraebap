import { createFileRoute, redirect } from '@tanstack/react-router';
import { HOME_PATH } from '@/shared/config';
import { sessionOptions } from '@/shared/auth';
import { WelcomePage } from './ui/WelcomePage';

/** /onboarding: 처음 로그인한 사람의 환영. 마치면 홈으로 가고, 마친 사람은 다시 오지 않는다. 앱 틀 밖이다. */
export const Route = createFileRoute('/onboarding/')({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.query({ ...sessionOptions(), staleTime: 'static' });
    if (!session) throw redirect({ to: '/login', replace: true });
    if (session.onboarded) throw redirect({ href: HOME_PATH, replace: true });
  },
  component: function WelcomeRoute() { return <WelcomePage onDone={() => window.location.replace(HOME_PATH)} />; },
});
