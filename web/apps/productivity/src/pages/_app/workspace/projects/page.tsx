import { createFileRoute } from '@tanstack/react-router';
import { projectsOptions } from '@/entities/project';
import { useCrumbs } from '@/shared/lib/page-crumbs';
import { ProjectsPage } from './ui/ProjectsPage';

type Status = 'ACTIVE' | 'ARCHIVED' | 'DELETED';

/** /workspace/projects: 프로젝트 목록. ?status=로 보관함 · 삭제됨을 본다. */
export const Route = createFileRoute('/_app/workspace/projects/')({
  loaderDeps: ({ search }) => ({ status: (search as { status?: string }).status }),
  loader: ({ context, deps }) => {
    const status: Status = deps.status === 'ARCHIVED' || deps.status === 'DELETED' ? deps.status : 'ACTIVE';
    return context.queryClient.query(projectsOptions(status)).catch(() => undefined);
  },
  component: function ProjectsRoute() { return <ProjectsPage crumbs={useCrumbs()} />; },
});
