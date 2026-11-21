import { createFileRoute } from '@tanstack/react-router';
import { useCrumbs } from '@/shared/lib/page-crumbs';
import { WorkItemEditPage } from './ui/WorkItemEditPage';

/** /workspace/projects/{key}/work-items/{번호}/edit: 업무 고치기. */
export const Route = createFileRoute('/_app/workspace/projects/$key/work-items/$number/edit/')({
  component: function WorkItemEditPageRoute() {
    const { key, number } = Route.useParams();
    return <WorkItemEditPage crumbs={useCrumbs()} projectKey={key} number={Number(number)} />;
  },
});
