import { createFileRoute } from '@tanstack/react-router';
import { useCrumbs } from '@/shared/lib/page-crumbs';
import { rolesOptions } from './api/roles';
import { RolesPage } from './ui/RolesPage';

/** /instance/members: 구성원 · 권한. */
export const Route = createFileRoute('/_app/instance/members/')({
  loader: ({ context }) => context.queryClient.query({ ...rolesOptions(), staleTime: 'static' }),
  component: function MembersRoute() { return <RolesPage crumbs={useCrumbs()} />; },
});
