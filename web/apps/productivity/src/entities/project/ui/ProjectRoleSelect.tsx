import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/kit/select';
import { PROJECT_ROLES, PROJECT_ROLE_LABEL, type ProjectRole } from '../api/projects';
import { PROJECT_ROLE_ICON } from './ProjectRoleLabel';

const NONE = 'NONE';
const ROLE_HINT: Record<ProjectRole, string> = { VIEWER: '보기 · 댓글', EDITOR: '업무 · 문서 쓰기', ADMIN: '설정 · 멤버 관리' };

/**
 * A member's role in one project, picked from 뷰어 · 에디터 · 관리자 (and 없음 where taking them out is offered, as on
 * the area's members page). Each choice says what it lets them do.
 */
export function ProjectRoleSelect({ label, value, onChange, canClear = false, isDisabled = false, size = 'sm' }: {
  /** 화면 읽기용 이름(누구의 어느 프로젝트 역할인지). */
  label: string;
  value: ProjectRole | null;
  onChange: (role: ProjectRole | null) => void;
  canClear?: boolean;
  isDisabled?: boolean;
  size?: 'sm' | 'default';
}) {
  const items = [...(canClear ? [{ value: NONE, label: '없음' }] : []), ...PROJECT_ROLES.map(role => ({ value: role, label: PROJECT_ROLE_LABEL[role] }))];
  return (
    <Select items={items} value={value ?? NONE} disabled={isDisabled}
      onValueChange={next => { if (next != null) onChange(next === NONE ? null : next as ProjectRole); }}>
      <SelectTrigger aria-label={label} size={size} className="min-w-24"><SelectValue /></SelectTrigger>
      <SelectContent>
        {canClear ? <SelectItem value={NONE}>없음</SelectItem> : null}
        {PROJECT_ROLES.map(role => {
          const RoleIcon = PROJECT_ROLE_ICON[role];
          return (
            <SelectItem key={role} value={role}>
              <RoleIcon className="text-icon-muted" />
              <span>{PROJECT_ROLE_LABEL[role]}</span>
              <span className="text-muted-foreground">{ROLE_HINT[role]}</span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
