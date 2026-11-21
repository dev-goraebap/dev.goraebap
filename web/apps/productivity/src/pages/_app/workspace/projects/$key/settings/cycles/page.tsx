import { createFileRoute } from '@tanstack/react-router';
import { useCrumbs } from '@/shared/lib/page-crumbs';
import { ProjectCycleSettingsPage } from './ui/ProjectCycleSettingsPage';

/** /workspace/projects/{key}/settings/cycles: 사이클 설정. */
export const Route = createFileRoute('/_app/workspace/projects/$key/settings/cycles/')({
  component: function ProjectCycleSettingsPageRoute() {
    const { key } = Route.useParams();
    return <ProjectCycleSettingsPage crumbs={useCrumbs()} projectKey={key} />;
  },
});
