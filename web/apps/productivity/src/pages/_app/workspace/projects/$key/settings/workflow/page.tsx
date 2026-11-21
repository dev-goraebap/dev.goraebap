import { createFileRoute } from '@tanstack/react-router';
import { prepare } from '@/shared/lib/prepare';
import { columnsOptions } from '@/entities/work-item';
import { useCrumbs } from '@/shared/lib/page-crumbs';
import { ProjectWorkflowPage } from './ui/ProjectWorkflowPage';

/** /workspace/projects/{key}/settings/workflow: 보드 칸(워크플로). */
export const Route = createFileRoute('/_app/workspace/projects/$key/settings/workflow/')({
  loader: ({ context, location, params }) => prepare(context.queryClient, location.href, ({ prime }) => Promise.all([prime(columnsOptions(params.key))])),
  component: function ProjectWorkflowPageRoute() {
    const { key } = Route.useParams();
    return <ProjectWorkflowPage crumbs={useCrumbs()} projectKey={key} />;
  },
});
