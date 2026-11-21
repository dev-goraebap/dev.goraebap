import { useNavigate } from '@tanstack/react-router';
import { kindOf, type NotificationItem } from '@/entities/notification';
import { BrandMark } from '@/shared/ui/brand';
import { SplitRow } from '@/shared/ui/kit/layout/split-view';
import { PersonAvatar } from '@/shared/ui/person';
import { momentOf } from '../model/format';

/**
 * One notice: who sent it (the system's own notices the company's mark in the same place), its title, what it reports and
 * its words, and when it came; an unread one tinted, the chosen one marked. Pressed anywhere it opens in the detail
 * (/inbox/{id}); the sender's avatar opens their profile.
 */
export function NotificationRow({ item, now, isChosen, href }: { item: NotificationItem; now: number; isChosen: boolean; href: string }) {
  const navigate = useNavigate();
  const kind = kindOf(item.kind);
  return <SplitRow title={item.title} description={item.message ? `${kind.label} · ${item.message}` : kind.label}
    onOpen={() => void navigate({ href })} isChosen={isChosen} isUnread={!item.readAt}
    start={<span className="flex size-11 items-center justify-center">{item.actorId
      ? <PersonAvatar id={item.actorId} name={item.actorName ?? undefined} size={32} />
      : <span className="flex size-8 items-center justify-center rounded-full bg-muted text-foreground"><BrandMark size="1rem" label="cowork" /></span>}</span>}
    end={<span className="text-xs text-muted-foreground tabular-nums">{momentOf(item.createdAt, now)}</span>} />;
}
