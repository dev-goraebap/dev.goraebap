import type { ReactNode } from 'react';
import { cn } from 'cn';
import { useAppearance } from '@/shared/lib/appearance';

/**
 * An inbox's list (받은 알림, 결재함): its rows under one name for assistive technology, parted by hairlines, at the height
 * the member chose (화면 설정 › 목록 높이; the compact variant reads data-density), as a page's list is.
 */
export function SplitList({ label, children }: { label: string; children: ReactNode }) {
  const { density } = useAppearance();
  return <ul aria-label={label} data-density={density} className="m-0 flex list-none flex-col bg-background p-0">{children}</ul>;
}

/**
 * One row of an inbox, opened wherever it is pressed: a button under the whole row does it, the row's own controls (an
 * avatar opening a profile) standing above it. Its mark at the start, its title, detail and trailing metadata. Unread rows
 * have a tinted surface; the chosen one and the one under the pointer a step deeper.
 */
export function SplitRow({ title, description, start, end, isChosen, isUnread, onOpen }: {
  title: string; description?: string; start?: ReactNode; end?: ReactNode; isChosen?: boolean; isUnread?: boolean; onOpen: () => void;
}) {
  return <li data-chosen={isChosen || undefined} data-unread={isUnread || undefined}
    className={cn('relative border-b',
      isUnread ? 'bg-unread hover:bg-unread-strong data-chosen:bg-unread-strong' : 'hover:bg-row-hover data-chosen:bg-unread-strong')}>
    <button type="button" aria-label={isUnread ? `${title}, 읽지 않음` : title} aria-current={isChosen || undefined} onClick={onOpen}
      className="absolute inset-0 w-full cursor-pointer outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset" />
    <div className="pointer-events-none relative flex items-center gap-2 px-4 py-3 compact:py-1.5">
      {start ? <div className="flex shrink-0 items-center [&_:is(button,a)]:pointer-events-auto">{start}</div> : null}
      <div className="flex min-w-0 flex-auto flex-col">
        <span className="truncate text-sm">{title}</span>
        {description ? <span className="truncate text-xs text-muted-foreground">{description}</span> : null}
      </div>
      {end ? <div className="flex shrink-0 items-center [&_:is(button,a)]:pointer-events-auto">{end}</div> : null}
    </div>
  </li>;
}
