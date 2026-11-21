import { createFileRoute } from '@tanstack/react-router';
import { useCrumbs } from '@/shared/lib/page-crumbs';
import { ProjectGeneralPage } from './ui/ProjectGeneralPage';

/** /workspace/projects/{key}/settings/general: 프로젝트 이름 · 키 · 설명. */
export const Route = createFileRoute('/_app/workspace/projects/$key/settings/general/')({
  component: function ProjectGeneralPageRoute() {
    const { key } = Route.useParams();
    return <ProjectGeneralPage crumbs={useCrumbs()} projectKey={key} />;
  },
});
