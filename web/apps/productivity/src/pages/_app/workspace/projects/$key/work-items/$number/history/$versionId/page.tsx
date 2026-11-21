import { createFileRoute } from '@tanstack/react-router';
import { useCrumbs } from '@/shared/lib/page-crumbs';
import { BodyHistoryPage } from '@/pages/_app/workspace/projects/$key/ui/BodyHistoryPage';

/** 업무 본문의 버전 하나. */
export const Route = createFileRoute('/_app/workspace/projects/$key/work-items/$number/history/$versionId/')({
  component: function BodyHistoryPageRoute() {
    const { key, number, versionId } = Route.useParams();
    return <BodyHistoryPage crumbs={useCrumbs()} target={{ kind: 'work-item', projectKey: key, number: Number(number) }} versionId={versionId} />;
  },
});
