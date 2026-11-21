import { useEffect, type ReactNode } from 'react';
import { targetOf, useReadNotification, type NotificationItem } from '@/entities/notification';
import { SplitColumn, SplitDetail } from '@/shared/ui/kit/layout/split-view';
import { NoticeItself } from './NoticeItself';
import { WorkItemNotice } from './WorkItemNotice';

/**
 * What a notice's detail shows, for the place it is shown in to frame: its title (the phone page's last crumb), the menu
 * for after it, and its content, which either lays itself out (column false: a work item) or is sections for a
 * settings-page column under the title and description.
 */
export type NoticeView = {
  title: string; description?: string; menu?: ReactNode; content: ReactNode; column: boolean;
  /** What it is, over it in the inbox (DEMO-12), and its own page, the way out of the inbox to it. */
  label: string; href?: string;
};
export type NoticeFrame = (view: NoticeView) => ReactNode;

/**
 * A notice opened: the work item it points to shown in place, or, for anything else or a target that is gone, the notice
 * itself. Opening it marks it read. frame lays the view out where it is shown (the inbox's detail, a phone's page).
 */
export function NoticeDetail({ item, frame }: { item: NotificationItem; frame: NoticeFrame }) {
  const { mutate: read } = useReadNotification();
  const unread = !item.readAt;
  useEffect(() => { if (unread) read(item.id); }, [unread, item.id, read]);
  const target = targetOf(item.link);
  if (target) return <WorkItemNotice key={`${target.projectKey}-${target.number}`} target={target} frame={frame} />;
  return <NoticeItself item={item} frame={frame} />;
}

/**
 * A view laid out in the inbox's detail under its bar (what it is, its menu, the way to its page): sections in a
 * settings-page column under the title, or as it lays itself out.
 */
export const inboxFrame: NoticeFrame = view => <SplitDetail label={view.label} title={view.title} href={view.href} menu={view.menu}>
  {view.column ? <SplitColumn title={view.title} description={view.description}>{view.content}</SplitColumn> : view.content}
</SplitDetail>;
