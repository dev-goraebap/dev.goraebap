import { createFileRoute, redirect } from '@tanstack/react-router';
import { HOME_PATH } from '@/shared/config';
import { isExactly } from '@/shared/lib/route-location';

/**
 * /workspace/settings 아래 전부: 워크스페이스 관리자만 연다(그 밖의 사람은 홈으로). /workspace/settings 자체는 첫 화면
 * (일반)으로 보낸다.
 */
export const Route = createFileRoute('/_app/workspace/settings')({
  beforeLoad: ({ context, location }) => {
    if (!(context.session.roles ?? []).includes('WORKSPACE_ADMIN')) throw redirect({ href: HOME_PATH, replace: true });
    if (isExactly(location.pathname, '/workspace/settings'))
      throw redirect({ href: '/workspace/settings/general' + location.searchStr, replace: true });
  },
});
