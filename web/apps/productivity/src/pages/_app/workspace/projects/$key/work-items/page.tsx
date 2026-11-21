import { createFileRoute } from '@tanstack/react-router';
import { prepare } from '@/shared/lib/prepare';
import { useCrumbs } from '@/shared/lib/page-crumbs';
import { prepareWorkItemList } from './model/prepare';
import { ProjectWorkItemsPage } from './ui/ProjectWorkItemsPage';

/** /workspace/projects/{key}/work-items: 프로젝트 업무 목록. 보기(?view)와 거르기는 주소의 쿼리가 정한다. */
export const Route = createFileRoute('/_app/workspace/projects/$key/work-items/')({
  loaderDeps: ({ search }) => search,
  loader: ({ context, params, location }) => prepare(context.queryClient, location.href, prep => prepareWorkItemList(prep, params.key, location.searchStr)),
  component: function ProjectWorkItemsPageRoute() {
    return <ProjectWorkItemsPage crumbs={useCrumbs()} />;
  },
});
