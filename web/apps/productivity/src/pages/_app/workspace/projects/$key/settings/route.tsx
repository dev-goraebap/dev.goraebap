import { createFileRoute, redirect } from '@tanstack/react-router';
import { projectOptions } from '@/entities/project';
import { isExactly } from '@/shared/lib/route-location';

/**
 * 프로젝트 설정 아래 전부: 그 프로젝트의 관리자(워크스페이스 관리자는 모든 프로젝트의 관리자)만 연다. 설정 주소 자체는
 * 첫 화면(일반)으로 보낸다.
 */
export const Route = createFileRoute('/_app/workspace/projects/$key/settings')({
  beforeLoad: async ({ context, params, location }) => {
    const project = await context.queryClient.query({ ...projectOptions(params.key), staleTime: 'static' }).catch(() => null);
    if (!project?.can.manage) throw redirect({ href: `/workspace/projects/${params.key}/work-items`, replace: true });
    const settings = `/workspace/projects/${params.key}/settings`;
    if (isExactly(decodeURI(location.pathname), settings)) throw redirect({ href: `${settings}/general`, replace: true });
  },
});
