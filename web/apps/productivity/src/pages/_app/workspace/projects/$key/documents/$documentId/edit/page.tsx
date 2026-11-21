import { createFileRoute } from '@tanstack/react-router';
import { prepare } from '@/shared/lib/prepare';
import { useCrumbs } from '@/shared/lib/page-crumbs';
import { DocumentEditPage } from '@/pages/_app/workspace/projects/$key/documents/ui/DocumentEditPage';
import { prepareDocuments } from '@/pages/_app/workspace/projects/$key/documents/model/prepare';

/** /workspace/projects/{key}/documents/{id}/edit: 문서 고치기. */
export const Route = createFileRoute('/_app/workspace/projects/$key/documents/$documentId/edit/')({
  loader: ({ context, params, location }) => prepare(context.queryClient, location.href,
    prep => prepareDocuments(prep, { projectKey: params.key, documentId: params.documentId })),
  component: function DocumentEditPageRoute() {
    const { key, documentId } = Route.useParams();
    return <DocumentEditPage crumbs={useCrumbs()} projectKey={key} documentId={documentId} />;
  },
});
