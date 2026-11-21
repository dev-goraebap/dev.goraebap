import { createFileRoute } from '@tanstack/react-router';
import { labelsOptions } from '@/entities/work-item';
import { useCrumbs } from '@/shared/lib/page-crumbs';
import { WorkItemLabelsPage } from './ui/WorkItemLabelsPage';

/** /workspace/settings/work-item-labels: 업무 라벨. */
export const Route = createFileRoute('/_app/workspace/settings/work-item-labels/')({
  loader: ({ context }) => context.queryClient.query(labelsOptions()).catch(() => undefined),
  component: function WorkItemLabelsRoute() { return <WorkItemLabelsPage crumbs={useCrumbs()} />; },
});
