import { createFileRoute } from '@tanstack/react-router';
import { useCrumbs } from '@/shared/lib/page-crumbs';
import { BodyHistoryPage } from '@/pages/_app/workspace/projects/$key/ui/BodyHistoryPage';

/** 문서 본문의 버전 기록. 상세에서는 같은 주소를 대화상자로 연다. */
export const Route = createFileRoute('/_app/workspace/projects/$key/documents/$documentId/history/')({
  component: function BodyHistoryPageRoute() {
    const { key, documentId } = Route.useParams();
    return <BodyHistoryPage crumbs={useCrumbs()} target={{ kind: 'document', projectKey: key, documentId }} />;
  },
});
