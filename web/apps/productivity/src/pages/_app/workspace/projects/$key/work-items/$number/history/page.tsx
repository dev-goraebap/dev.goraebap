import { createFileRoute } from '@tanstack/react-router';
import { useCrumbs } from '@/shared/lib/page-crumbs';
import { BodyHistoryPage } from '@/pages/_app/workspace/projects/$key/ui/BodyHistoryPage';

/** 업무 본문의 버전 기록. 상세에서는 같은 주소를 대화상자로 연다. */
export const Route = createFileRoute('/_app/workspace/projects/$key/work-items/$number/history/')({
  component: function BodyHistoryPageRoute() {
    const { key, number } = Route.useParams();
    return <BodyHistoryPage crumbs={useCrumbs()} target={{ kind: 'work-item', projectKey: key, number: Number(number) }} />;
  },
});
