import { createFileRoute } from '@tanstack/react-router';
import { useCrumbs } from '@/shared/lib/page-crumbs';
import { WorkspaceMembersPage } from './ui/WorkspaceMembersPage';

/** /workspace/members: 워크스페이스 멤버와 각자 참여한 프로젝트. */
export const Route = createFileRoute('/_app/workspace/members/')({
  component: function WorkspaceMembersRoute() { return <WorkspaceMembersPage crumbs={useCrumbs()} />; },
});
