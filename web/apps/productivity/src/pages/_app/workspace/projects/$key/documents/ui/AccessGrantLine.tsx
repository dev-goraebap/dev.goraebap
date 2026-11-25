import type { AccessLevel, Grant, GrantSubject } from '@/entities/document';
import { Button } from '@goraebap/ui-react/compact/button';
import { ProjectsIcon, UserIcon, XIcon, type Icon } from '@/shared/ui/kit/icon';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@goraebap/ui-react/compact/select';

const LEVELS: { value: Grant['level']; label: string }[] = [{ value: 'READ', label: '보기' }, { value: 'WRITE', label: '쓰기' }, { value: 'MANAGE', label: '관리' }];
export const ACCESS_LEVEL_TEXT: Record<AccessLevel, string> = { NONE: '볼 수 없음', READ: '보기', WRITE: '쓰기', MANAGE: '관리' };
const SUBJECT_ICON: Record<GrantSubject, Icon> = { OWNER: UserIcon, USER: UserIcon, PROJECT: ProjectsIcon };
const SUBJECT_TEXT: Record<GrantSubject, string> = { OWNER: '만든 사람', USER: '사람', PROJECT: '프로젝트' };

/** One grant's line: who (and what kind of subject), and how far, changeable or not. */
export function AccessGrantLine({ grant, onLevel, onRemove }: { grant: Grant; onLevel?: (level: Grant['level']) => void; onRemove?: () => void }) {
  const SubjectIcon = SUBJECT_ICON[grant.subject];
  return <div className="flex min-h-10 items-center gap-2 border-b py-1">
    <SubjectIcon className="size-4 shrink-0 text-icon-muted" />
    <div className="flex min-w-0 flex-1 flex-col">
      <span className="truncate">{grant.name ?? (grant.subject === 'OWNER' ? '만든 사람' : '이름 없음')}</span>
      {grant.name || grant.subject !== 'OWNER' ? <span className="text-xs text-muted-foreground">{SUBJECT_TEXT[grant.subject]}</span> : null}
    </div>
    {onLevel
      ? <Select items={LEVELS} value={grant.level} onValueChange={value => { if (value) onLevel(value as Grant['level']); }}>
        <SelectTrigger size="sm" aria-label={`${grant.name ?? ''} 권한`} className="min-w-20"><SelectValue /></SelectTrigger>
        <SelectContent><SelectGroup>
          {LEVELS.map(level => <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>)}
        </SelectGroup></SelectContent>
      </Select>
      : <span className="text-xs text-muted-foreground">{ACCESS_LEVEL_TEXT[grant.level]}</span>}
    {onRemove ? <Button variant="ghost" size="icon-sm" aria-label={`${grant.name ?? ''} 빼기`} title="빼기" onClick={onRemove}><XIcon /></Button> : null}
  </div>;
}
