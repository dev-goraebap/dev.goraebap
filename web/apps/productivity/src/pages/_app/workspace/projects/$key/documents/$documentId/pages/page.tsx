import { createFileRoute } from '@tanstack/react-router';
import { prepare } from '@/shared/lib/prepare';
import { useCrumbs } from '@/shared/lib/page-crumbs';
import { DocumentPagesManager } from '@/pages/_app/workspace/projects/$key/documents/ui/DocumentPagesManager';
import { prepareDocumentPages } from '@/pages/_app/workspace/projects/$key/documents/model/prepare';

/** /workspace/projects/{key}/documents/{id}/pages: 문서의 하위 페이지 관리. */
export const Route = createFileRoute('/_app/workspace/projects/$key/documents/$documentId/pages/')({
  loader: ({ context, params, location }) => prepare(context.queryClient, location.href, prep => prepareDocumentPages(prep, params.key)),
  component: function DocumentPagesManagerRoute() {
    const { key, documentId } = Route.useParams();
    return <DocumentPagesManager crumbs={useCrumbs()} projectKey={key} documentId={documentId} />;
  },
});
