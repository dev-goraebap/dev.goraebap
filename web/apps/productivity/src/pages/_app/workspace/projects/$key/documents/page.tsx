import { createFileRoute } from '@tanstack/react-router';
import { prepare } from '@/shared/lib/prepare';
import { useCrumbs } from '@/shared/lib/page-crumbs';
import { DocumentLibraryPage as DocumentBoxPage } from '@/pages/_app/workspace/projects/$key/documents/ui/DocumentLibraryPage';
import { prepareDocuments } from '@/pages/_app/workspace/projects/$key/documents/model/prepare';

/** /workspace/projects/{key}/documents: 프로젝트 문서함. */
export const Route = createFileRoute('/_app/workspace/projects/$key/documents/')({
  loader: ({ context, params, location }) => prepare(context.queryClient, location.href,
    prep => prepareDocuments(prep, { projectKey: params.key, documentId: new URLSearchParams(location.searchStr).get('chapter') ?? undefined })),
  component: function DocumentBoxPageRoute() {
    const { key } = Route.useParams();
    return <DocumentBoxPage crumbs={useCrumbs()} projectKey={key} />;
  },
});
