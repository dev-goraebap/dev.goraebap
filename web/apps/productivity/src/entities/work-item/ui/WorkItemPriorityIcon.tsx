import { cn } from 'cn';
import type { WorkItemPriority } from '../model/types';
import { priorityMark } from '../model/words';

/** A priority's own mark: graded bars, dashes for none, and Solar's siren for urgent. */
export function WorkItemPriorityIcon({ priority = 'NONE', className }: { priority?: WorkItemPriority; className?: string }) {
  const mark = priorityMark(priority);
  const label = priority === 'NONE' ? '우선순위 없음' : mark.label;
  const classes = cn('shrink-0', mark.tone, className);
  if (priority === 'URGENT') return <mark.icon role="img" aria-hidden={false} aria-label={label} className={classes} />;
  const level = priority === 'HIGH' ? 3 : priority === 'MEDIUM' ? 2 : 1;
  return <svg viewBox="0 0 24 24" width="1rem" height="1rem" className={classes} role="img" aria-label={label} focusable="false">
    {priority === 'NONE'
      ? <path d="M3 12h3 M10.5 12h3 M18 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      : [7, 12, 18].map((height, index) => <rect key={height} x={3 + index * 7} y={21 - height} width="4" height={height} rx="1"
        fill="currentColor" opacity={index < level ? 1 : 0.24} />)}
  </svg>;
}
