import { createFileRoute } from '@tanstack/react-router';
import { useCrumbs } from '@/shared/lib/page-crumbs';
import { PushDeliveriesPage } from './ui/PushDeliveriesPage';

/** /instance/push-deliveries: 알림 발송 현황. */
export const Route = createFileRoute('/_app/instance/push-deliveries/')({
  component: function PushDeliveriesRoute() { return <PushDeliveriesPage crumbs={useCrumbs()} />; },
});
