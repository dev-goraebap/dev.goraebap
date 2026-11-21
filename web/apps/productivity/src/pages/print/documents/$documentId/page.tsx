import { createFileRoute, redirect } from '@tanstack/react-router';
import { sessionOptions } from '@/shared/auth';
import { DocumentPrintPage } from './ui/DocumentPrintPage';

/** /print/documents/{id}: 문서를 하위 페이지까지 이어 붙인 인쇄용 화면(PDF 내보내기). 앱 틀 없이, 로그인한 사람만. */
export const Route = createFileRoute('/print/documents/$documentId/')({
  beforeLoad: async ({ context }) => {
    if (!await context.queryClient.query({ ...sessionOptions(), staleTime: 'static' })) throw redirect({ to: '/login', replace: true });
  },
  component: DocumentPrintPage,
});
