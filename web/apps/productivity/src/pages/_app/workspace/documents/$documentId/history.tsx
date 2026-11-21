import { createFileRoute, redirect } from '@tanstack/react-router';
import { unmaskDialogHref } from '@/shared/lib/panel';

/** 본문의 버전 기록 옛 짧은 주소: 문서를 버전 기록이 열린 채로 연다(useMaskedDialog). */
export const Route = createFileRoute('/_app/workspace/documents/$documentId/history')({
  beforeLoad: ({ location }) => { throw redirect({ href: unmaskDialogHref(location.pathname, location.searchStr, 'history'), replace: true }); },
});
