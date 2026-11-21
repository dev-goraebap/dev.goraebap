import { useNavigate } from '@tanstack/react-router';
import { ActionMenu } from '@/shared/ui/kit/action-menu';
import { CircleCheckIcon, SettingsIcon } from '@/shared/ui/kit/icon';

/** The page's own menu: 모두 읽음 while any wait, and 알림 설정. */
export function NotificationsMenu({ unread, onReadAll }: { unread: number; onReadAll: () => void }) {
  const navigate = useNavigate();
  return <ActionMenu label="알림함 메뉴" actions={[
    ...(unread > 0 ? [{ label: `모두 읽음 (${unread})`, icon: CircleCheckIcon, onSelect: onReadAll }] : []),
    { label: '알림 설정', icon: SettingsIcon, onSelect: () => void navigate({ href: '/account/notifications' }) },
  ]} />;
}
