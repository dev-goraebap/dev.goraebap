import { createFileRoute, redirect } from '@tanstack/react-router';
import { HOME_PATH } from '@/shared/config';
import { isExactly } from '@/shared/lib/route-location';

/** /instance 아래 전부: 인스턴스 관리자만 연다(그 밖의 사람은 홈으로). /instance 자체는 첫 화면(구성원 · 권한)으로 보낸다. */
export const Route = createFileRoute('/_app/instance')({
  beforeLoad: ({ context, location }) => {
    if (!(context.session.roles ?? []).includes('INSTANCE_ADMIN')) throw redirect({ href: HOME_PATH, replace: true });
    if (isExactly(location.pathname, '/instance')) throw redirect({ href: '/instance/members' + location.searchStr, replace: true });
  },
});
