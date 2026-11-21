import { createFileRoute, redirect } from '@tanstack/react-router';

/** /account: 내 계정의 첫 화면(내 정보)으로 보낸다. */
export const Route = createFileRoute('/_app/account/')({
  beforeLoad: ({ location }) => { throw redirect({ href: '/account/profile' + location.searchStr, replace: true }); },
});
