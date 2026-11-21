import { cn } from 'cn';
import { Badge } from '@/shared/ui/kit/badge';
import { LabelDot } from '@/shared/ui/label-dot/LabelDot';
import type { LabelChip } from '../model/types';

/**
 * A work item's labels as pills in a row, each its saved colour's dot and its name; nothing when it has none. In one line
 * (nowrap) only the pills that fit whole are shown: the rest wrap below the line's height and are cut there, so no pill is
 * cut in half; a single pill wider than the room shortens its name.
 */
export function WorkItemLabels({ labels, wrap = 'nowrap', className }: { labels: readonly LabelChip[]; wrap?: 'nowrap' | 'wrap'; className?: string }) {
  if (labels.length === 0) return null;
  return <span className={cn('flex min-w-0 items-center gap-1', wrap === 'wrap' ? 'flex-wrap' : 'h-5.5 flex-wrap content-start overflow-hidden', className)}>
    {labels.map(label => <Badge key={label.id} variant="label" className="max-w-full shrink-0"><LabelDot color={label.color} /><span className="truncate">{label.name}</span></Badge>)}
  </span>;
}
