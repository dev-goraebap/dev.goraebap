import { createFileRoute } from '@tanstack/react-router';
import { useCrumbs } from '@/shared/lib/page-crumbs';
import { MyWorkPage } from './ui/MyWorkPage';

/** /my-work: 어느 프로젝트의 것이든 내가 담당한 업무. */
export const Route = createFileRoute('/_app/my-work/')({
  component: function MyWorkRoute() { return <MyWorkPage crumbs={useCrumbs()} />; },
});
