import { createFileRoute, redirect } from '@tanstack/react-router';
import { sessionOptions } from '@/shared/auth';
import { HOME_PATH } from '@/shared/config';
import { LoginGate } from './ui/LoginGate';

/** /login: 이메일 · 인증 코드 · 첫 실행을 한 화면에서. 이미 로그인했으면 홈으로. */
export const Route = createFileRoute('/login/')({
  beforeLoad: async ({ context }) => {
    if (await context.queryClient.query({ ...sessionOptions(), staleTime: 'static' })) throw redirect({ href: HOME_PATH, replace: true });
  },
  // 인증 경계에서는 라우트 선읽기와 조회 캐시를 포함한 브라우저 앱 상태를 새로 만든다.
  component: () => <LoginGate onSignedIn={async () => { window.location.replace(HOME_PATH); }} />,
});
