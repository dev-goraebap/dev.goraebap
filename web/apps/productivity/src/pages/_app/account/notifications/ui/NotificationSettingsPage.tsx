import { SettingsPage } from '@/shared/ui/kit/settings';
import { pageCrumbs } from '@/shared/ui/nav-icon';
import { NotificationDevicesSection } from './NotificationDevicesSection';
import { NotificationTopicsSection } from './NotificationTopicsSection';
import { ThisDeviceSection } from './ThisDeviceSection';

type Crumb = { label: string; href?: string; icon?: string };

/**
 * 알림 설정: this browser's push (one switch, and a test once it is on), which groups of notices come as a push on every
 * device, and the devices taking them.
 */
export function NotificationSettingsPage({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <SettingsPage crumbs={pageCrumbs(crumbs)} title="알림 설정">
      <ThisDeviceSection />
      <NotificationTopicsSection />
      <NotificationDevicesSection />
    </SettingsPage>
  );
}
