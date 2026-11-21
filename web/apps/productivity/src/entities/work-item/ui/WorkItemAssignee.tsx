import { cn } from 'cn';
import { PersonAvatar } from '@/shared/ui/person';

/** Nobody given: a dashed circle round a person's outline, in the same 20px slot as an avatar. */
function Unassigned() {
  return <svg viewBox="0 0 20 20" width="1.25rem" height="1.25rem" role="img" aria-label="담당자 없음" focusable="false" className="shrink-0 text-icon-muted">
    <circle cx="10" cy="10" r="9.25" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
    <circle cx="10" cy="7.5" r="2.25" fill="none" stroke="currentColor" strokeWidth="1.25" />
    <path d="M5.5 14.5a4.75 4.75 0 0 1 9 0" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
  </svg>;
}

/**
 * A work item's person: the avatar (or the unassigned outline) and the name (미지정). A row keeps a fixed width so the
 * columns line up; fitsContent lets it shrink to the name, alignsEnd pushes it to the end of a card's last line.
 */
export function WorkItemAssignee({ id, name, isCompact = false, alignsEnd = false, fitsContent = false, className }: {
  id?: string; name?: string; isCompact?: boolean; alignsEnd?: boolean; fitsContent?: boolean; className?: string;
}) {
  return <span className={cn('flex min-w-0 shrink-0 items-center gap-1.5 text-xs text-muted-foreground',
    alignsEnd ? 'ml-auto max-w-1/2' : fitsContent ? (isCompact ? 'max-w-28' : 'max-w-24') : (isCompact ? 'w-28' : 'w-24'), className)}>
    {id ? <PersonAvatar id={id} name={name ?? '이름 없음'} size={20} tooltip /> : <Unassigned />}
    <span className="min-w-0 flex-1 truncate">{id ? name ?? '이름 없음' : '미지정'}</span>
  </span>;
}
