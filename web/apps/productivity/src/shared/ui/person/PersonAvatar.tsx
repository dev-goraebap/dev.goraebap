import type { MouseEvent } from 'react';
import { cn } from 'cn';
import { avatarSource, derivedAvatar, drawnAvatarSource, useMemberPicture } from '@/shared/lib/avatar';
import { useOpenPanel } from '@/shared/lib/panel';
import { PersonAvatar as KitPersonAvatar } from '@/shared/ui/kit/person-avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@goraebap/ui-react/compact/tooltip';

/** A member's own page (구성원's profile), which a desktop opens as a dialog over the page in view. */
export const memberHref = (id: string) => `/workspace/members/${encodeURIComponent(id)}`;

/** Resolves a chosen picture or the member's default drawn avatar from directory data. */
export const memberPicture = avatarSource;

/** The sizes the old Avatar took: a named step or pixels. */
export type AvatarSize = 'xsm' | 'sm' | 'md' | 'lg' | 'xl' | 16 | 20 | 24 | 32 | 36 | 40 | 48 | 60 | 64 | 72 | 96 | 128 | 144 | 180;

const SIZE: Record<AvatarSize, string> = {
  xsm: 'size-5', sm: 'size-6', md: 'size-9', lg: 'size-12', xl: 'size-32',
  16: 'size-4', 20: 'size-5', 24: 'size-6', 32: 'size-8', 36: 'size-9', 40: 'size-10', 48: 'size-12', 60: 'size-15', 64: 'size-16',
  72: 'size-18', 96: 'size-24', 128: 'size-32', 144: 'size-36', 180: 'size-45',
};

/**
 * A member's avatar (the kit's PersonAvatar with cowork's pictures: the one chosen, else the drawn default): pressing
 * it opens their profile (memberHref; a dialog on a desktop, its page on a phone), even inside a row that opens something
 * else. Without an id (someone no longer known) it only shows; isStatic keeps it a picture where the avatar is part of a
 * choice (a picker's option) or the profile itself. On a phone the press takes a 44px target around the picture.
 */
export function PersonAvatar({ id, name, size = 24, tooltip = false, isStatic = false }: {
  id?: string; name?: string; size?: AvatarSize; tooltip?: boolean; isStatic?: boolean;
}) {
  const chosen = useMemberPicture(id);
  // Someone no longer known still shows the drawn default their name picks, the same on every screen.
  const picture = id ? chosen : drawnAvatarSource(derivedAvatar(name ?? ''));
  const openPanel = useOpenPanel();
  const label = name ?? '구성원';
  const avatar = <KitPersonAvatar name={name ?? ''} picture={picture} className={SIZE[size]} />;
  const open = (event: MouseEvent) => {
    // In a row that is a link of its own, the avatar goes to the person rather than the row's address.
    event.preventDefault();
    event.stopPropagation();
    if (id) openPanel(memberHref(id));
  };
  const shown = id && !isStatic
    ? <button type="button" aria-label={label} onClick={open}
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        // 휴대폰의 44px 누름 영역은 레이아웃 밖(::after)으로 넓혀, 글 줄 곁의 작은 아바타가 밀리지 않게 한다.
        'relative max-md:after:absolute max-md:after:-inset-3 max-md:after:rounded-full')}>{avatar}</button>
    : avatar;
  if (!tooltip || !name) return shown;
  return <Tooltip>
    <TooltipTrigger render={id && !isStatic ? shown : <span className="inline-flex shrink-0">{avatar}</span>} />
    <TooltipContent className="max-md:hidden">{name}</TooltipContent>
  </Tooltip>;
}
