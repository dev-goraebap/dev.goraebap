import { createFileRoute } from '@tanstack/react-router';
import { useCrumbs } from '@/shared/lib/page-crumbs';
import { WorkspaceRolesPage } from './ui/WorkspaceRolesPage';

/** /workspace/settings/roles: 워크스페이스 역할. */
export const Route = createFileRoute('/_app/workspace/settings/roles/')({
  component: function WorkspaceRolesRoute() { return <WorkspaceRolesPage crumbs={useCrumbs()} />; },
});
