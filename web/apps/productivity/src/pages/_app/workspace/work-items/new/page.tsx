import { createFileRoute } from '@tanstack/react-router';
import { useCrumbs } from '@/shared/lib/page-crumbs';
import { NewWorkItemPage } from './ui/NewWorkItemPage';

/** /workspace/work-items/new: 새 업무. 프로젝트 안에서 열면 ?project=로 그 프로젝트를 미리 고른다. */
export const Route = createFileRoute('/_app/workspace/work-items/new/')({
  component: function NewWorkItemRoute() {
    const { project } = Route.useSearch() as { project?: string };
    return <NewWorkItemPage crumbs={useCrumbs()} projectKey={project} />;
  },
});
