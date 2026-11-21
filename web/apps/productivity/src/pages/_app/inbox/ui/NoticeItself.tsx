import { inAppLink, kindOf, type NotificationItem } from '@/entities/notification';
import { ToneBadge } from '@/shared/ui/tone-badge';
import { momentOf } from '../model/format';
import type { NoticeFrame } from './NoticeDetail';

/** The notice itself: its title, words, when it came and its kind; its link, when it has one in the app, is its page. */
export function NoticeItself({ item, frame }: { item: NotificationItem; frame: NoticeFrame }) {
  const kind = kindOf(item.kind);
  return <>{frame({
    title: item.title, description: momentOf(item.createdAt, Date.now()), column: true, label: kind.label, href: inAppLink(item.link),
    content: <div className="flex flex-col items-start gap-4">
      <ToneBadge label={kind.label} tone={kind.color} />
      {item.message ? <p className="text-sm whitespace-pre-wrap">{item.message}</p> : null}
    </div>,
  })}</>;
}
