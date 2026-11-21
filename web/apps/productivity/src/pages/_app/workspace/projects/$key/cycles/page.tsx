import { createFileRoute } from '@tanstack/react-router';
import { useCrumbs } from '@/shared/lib/page-crumbs';
import { ProjectCyclesPage } from './ui/ProjectCyclesPage';

/** /workspace/projects/{key}/cycles: 사이클. */
export const Route = createFileRoute('/_app/workspace/projects/$key/cycles/')({
  component: function ProjectCyclesPageRoute() {
    return <ProjectCyclesPage crumbs={useCrumbs()} />;
  },
});
