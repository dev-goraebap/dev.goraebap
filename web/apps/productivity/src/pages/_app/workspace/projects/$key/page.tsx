import { createFileRoute } from '@tanstack/react-router';
import { useCrumbs } from '@/shared/lib/page-crumbs';
import { ProjectOverviewPage } from './ui/ProjectOverviewPage';

/** /workspace/projects/{key}: 프로젝트 개요. 프로젝트 목록에서 프로젝트를 누르면 열린다. */
export const Route = createFileRoute('/_app/workspace/projects/$key/')({
  component: function ProjectOverviewPageRoute() {
    const { key } = Route.useParams();
    return <ProjectOverviewPage crumbs={useCrumbs()} projectKey={key} />;
  },
});
