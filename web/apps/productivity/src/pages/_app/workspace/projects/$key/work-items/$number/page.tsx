import { createFileRoute } from '@tanstack/react-router';
import { prepare } from '@/shared/lib/prepare';
import { useCrumbs } from '@/shared/lib/page-crumbs';
import { prepareWorkItem } from './model/prepare';
import { WorkItemPage } from './ui/WorkItemPage';

/** /workspace/projects/{key}/work-items/{번호}: 업무 하나. 데스크톱에서 목록에서 열면 대화상자(PanelHost)로 뜬다. */
export const Route = createFileRoute('/_app/workspace/projects/$key/work-items/$number/')({
  loader: ({ context, params, location }) => prepare(context.queryClient, location.href, prep => prepareWorkItem(prep, params.key, Number(params.number))),
  component: function WorkItemPageRoute() {
    const { key, number } = Route.useParams();
    return <WorkItemPage crumbs={useCrumbs()} projectKey={key} number={Number(number)} />;
  },
});
