import { cn } from 'cn';
import type { ColumnCategory } from '../model/types';
import { categoryMark } from '../model/words';

/**
 * A status as its category's 16px icon in its colour. Given a label (the column's name) it is named for a screen reader;
 * without one it is a picture beside a name already written (an option, a row of settings), so it is not read twice.
 */
export function WorkItemStatusIcon({ category, label, className }: { category: ColumnCategory; label?: string; className?: string }) {
  const mark = categoryMark(category);
  if (!label) return <mark.icon aria-hidden className={cn('shrink-0', mark.tone, className)} />;
  return <mark.icon role="img" aria-hidden={false} aria-label={label} className={cn('shrink-0', mark.tone, className)} />;
}
