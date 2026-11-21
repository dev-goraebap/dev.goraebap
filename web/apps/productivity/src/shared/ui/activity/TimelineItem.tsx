import type { ReactNode } from 'react';
import { cn } from 'cn';

/*
 * The rule (activity's, after GitHub's): it runs down the middle of a comment card's 20px picture (the card's 1px border,
 * 12px in and half the picture: 23px). Each entry draws its own piece above (::before) and below (::after) its mark, so the
 * rule leaves the mark bare and stops at the first entry's mark and the last one's.
 */
const RAIL = 'relative before:absolute before:top-0 before:left-[calc(1.4375rem-0.5px)] before:w-px before:bg-input after:absolute after:bottom-0 after:left-[calc(1.4375rem-0.5px)] after:w-px after:bg-input first:before:hidden last:after:hidden';

/** An entry on the rule: a line hangs its mark on it; a card spans the width over it, its picture on the rule's line. */
export function TimelineItem({ mark, kind = 'line', children }: { mark?: ReactNode; kind?: 'line' | 'card'; children: ReactNode }) {
  if (kind === 'card') return <li className={cn(RAIL, 'py-2 before:h-2 after:top-2 *:relative *:z-1')}>{children}</li>;
  return <li className={cn(RAIL, 'grid grid-cols-[1.25rem_minmax(0,1fr)] items-start gap-x-3 py-1 pl-3.25 before:h-1 after:top-6')}>
    <span aria-hidden className="grid size-5 place-items-center text-icon-muted [&_svg]:size-4">{mark}</span>
    <div className="min-w-0">{children}</div>
  </li>;
}
