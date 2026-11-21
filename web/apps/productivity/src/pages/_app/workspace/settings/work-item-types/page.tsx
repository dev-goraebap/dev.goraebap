import { createFileRoute } from '@tanstack/react-router';
import { typesOptions } from '@/entities/work-item';
import { useCrumbs } from '@/shared/lib/page-crumbs';
import { WorkItemTypesPage } from './ui/WorkItemTypesPage';

/** /workspace/settings/work-item-types: 업무 유형. */
export const Route = createFileRoute('/_app/workspace/settings/work-item-types/')({
  loader: ({ context }) => context.queryClient.query(typesOptions()).catch(() => undefined),
  component: function WorkItemTypesRoute() { return <WorkItemTypesPage crumbs={useCrumbs()} />; },
});
