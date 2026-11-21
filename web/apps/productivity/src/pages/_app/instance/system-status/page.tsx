import { createFileRoute } from '@tanstack/react-router';
import { useCrumbs } from '@/shared/lib/page-crumbs';
import { SystemStatusPage } from './ui/SystemStatusPage';

/** /instance/system-status: 시스템 현황. 보기(?tab)는 같은 페이지 안에서 바뀐다. */
export const Route = createFileRoute('/_app/instance/system-status/')({
  component: function SystemStatusRoute() { return <SystemStatusPage crumbs={useCrumbs()} />; },
});
