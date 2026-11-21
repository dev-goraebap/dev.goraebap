import { cn } from 'cn';
import { REORDER_GHOST, reorderRowClass } from '@/shared/ui/kit/reorder';

/**
 * The looks of rows put in order by their grips (useRowReorder), as classes: the kit's reorder parts (@/shared/ui/reorder)
 * draw the same. list holds the rows; row is one, ruled from the one above it, its place an empty dashed slot while it is
 * carried; grip is the handle, quiet until the row is under the pointer, a thumb's 44px on a phone; ghost is the copy that
 * follows the hand (useRowReorder's ghostClass); spoken is what is read out but not shown (the hint, each step).
 */
export const rowReorderStyles = {
  list: 'relative flex flex-col',
  row: cn(reorderRowClass, '[&+&]:border-t'),
  grip: cn(
    'inline-grid h-7 w-5 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted-foreground/50 outline-none select-none [-webkit-touch-callout:none] [&_svg]:size-4',
    'transition-colors group-hover/reorder-row:text-icon-muted hover:bg-accent hover:text-foreground focus-visible:text-icon-muted focus-visible:ring-2 focus-visible:ring-ring',
    'max-md:h-11 max-md:w-11 max-md:text-icon-muted max-md:[&_svg]:size-5',
  ),
  ghost: REORDER_GHOST,
  spoken: 'sr-only',
} as const;
