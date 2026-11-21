import { createFileRoute } from '@tanstack/react-router';
import { useCrumbs } from '@/shared/lib/page-crumbs';
import { NotificationSettingsPage } from './ui/NotificationSettingsPage';

/** /account/notifications: 알림 설정. */
export const Route = createFileRoute('/_app/account/notifications/')({
  component: function NotificationSettingsRoute() { return <NotificationSettingsPage crumbs={useCrumbs()} />; },
});
