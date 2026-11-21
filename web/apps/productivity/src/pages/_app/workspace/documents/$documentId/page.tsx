import { createFileRoute, redirect } from '@tanstack/react-router';
import { documentOptions } from '@/entities/document';
import { HOME_PATH } from '@/shared/config';

/**
 * /workspace/documents/{id}: 옛 문서 주소. 그 문서가 있는 프로젝트의 문서 주소로 보낸다(매뉴얼의 장 ?chapter=는 그 장을 열고
 * 매뉴얼을 ?collection=로 남긴다). 찾을 수 없으면 프로젝트 목록으로.
 */
export const Route = createFileRoute('/_app/workspace/documents/$documentId/')({
  beforeLoad: async ({ context, params, location }) => {
    const view = await context.queryClient.query({ ...documentOptions(params.documentId), staleTime: 'static' }).catch(() => null);
    const projectKey = view?.document.projectKey;
    if (!projectKey) throw redirect({ href: HOME_PATH, replace: true });
    const chapter = new URLSearchParams(location.searchStr).get('chapter');
    const base = `/workspace/projects/${projectKey}/documents`;
    throw redirect({ href: chapter ? `${base}/${chapter}?collection=${params.documentId}` : `${base}/${params.documentId}`, replace: true });
  },
});
