import { createFileRoute, redirect } from '@tanstack/react-router';

/** /workspace/projects/new: 새 프로젝트는 목록 위 대화상자(PanelHost)로 연다. 주소로 직접 오면 목록으로 보낸다. */
export const Route = createFileRoute('/_app/workspace/projects/new')({
  beforeLoad: () => { throw redirect({ href: '/workspace/projects', replace: true }); },
});
