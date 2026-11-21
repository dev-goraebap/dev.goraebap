import { createFileRoute, redirect } from '@tanstack/react-router';
import { HOME_PATH } from '@/shared/config';

/** /workspace/documents: 옛 문서함 주소. 문서는 프로젝트마다 있으므로 프로젝트 목록으로 보낸다. */
export const Route = createFileRoute('/_app/workspace/documents/')({
  beforeLoad: () => { throw redirect({ href: HOME_PATH, replace: true }); },
});
