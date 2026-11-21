import { createFileRoute, redirect } from '@tanstack/react-router';
import { HOME_PATH } from '@/shared/config';

/**
 * /: 홈(프로젝트 목록)으로 보낸다. 주소에 나타나지 않는 _app(route.tsx)은 아래 라우트가 맞을 때만 맞으므로, / 를 받을
 * 자식이 따로 있어야 한다(route.tsx의 beforeLoad로 옮기면 / 가 어디에도 맞지 않아 되돌이 고리에 빠진다).
 */
export const Route = createFileRoute('/_app/')({
  beforeLoad: ({ location }) => { throw redirect({ href: HOME_PATH + location.searchStr, replace: true }); },
});
