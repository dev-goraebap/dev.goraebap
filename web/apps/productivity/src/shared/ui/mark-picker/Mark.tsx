import type { CSSProperties } from 'react';
import { cn } from 'cn';
import { MarkIcon } from './MarkIcon';

// The mark's colour is data (the one picked), handed to its classes as --mark.
export const markTone = (color?: string | null) => (color ? { '--mark': color } as CSSProperties : undefined);

const SIZE = {
  xs: 'size-3.5 rounded-[0.1875rem] text-[0.5625rem] [&_svg]:size-2.5',
  sm: 'size-5 rounded-sm text-[0.6875rem] [&_svg]:size-3.25',
  md: 'size-7 rounded-md text-xs [&_svg]:size-4 max-md:size-8 max-md:[&_svg]:size-5',
  // 개요 머리(프로젝트 개요)의 큰 표식.
  lg: 'size-12 rounded-xl text-lg [&_svg]:size-6',
} as const;

/**
 * A mark (BIT's ProjectMark, for anything that has one): its icon in its colour on a faint wash of that colour, or, with no
 * icon, the letter's first character on a muted square. xs (14px) sits in a chip, sm (20px) in menus and the trail, md
 * (28px) at a list row's lead.
 */
export function Mark({ icon, color, letter, size = 'sm', isCircular }: { icon?: string | null; color?: string | null; letter: string; size?: 'xs' | 'sm' | 'md' | 'lg'; isCircular?: boolean }) {
  const isTinted = Boolean(icon || color);
  return (
    // check-ui: allow-style 표식의 색은 사용자가 고른 데이터다.
    <span aria-hidden="true" style={markTone(color)}
      className={cn('inline-grid shrink-0 place-items-center leading-none font-bold', SIZE[size], isCircular && 'rounded-full',
        isTinted ? 'bg-[color-mix(in_srgb,var(--mark,var(--muted-foreground))_16%,transparent)] text-(--mark,var(--muted-foreground))' : 'bg-muted text-muted-foreground')}>
      {icon ? <MarkIcon name={icon} /> : letter.slice(0, 1)}
    </span>
  );
}
