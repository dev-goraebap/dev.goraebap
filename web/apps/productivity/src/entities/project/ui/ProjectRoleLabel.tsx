import { cn } from 'cn';
import { EyeIcon, PencilIcon, ShieldCheckIcon, type Icon } from '@/shared/ui/kit/icon';
import { PROJECT_ROLE_LABEL, type ProjectRole } from '../api/projects';

/** Each role's icon: a viewer looks, an editor writes, an administrator keeps the project. */
export const PROJECT_ROLE_ICON: Record<ProjectRole, Icon> = { VIEWER: EyeIcon, EDITOR: PencilIcon, ADMIN: ShieldCheckIcon };

/** A member's role in a project as data in a row: its icon and name (뷰어 · 에디터 · 관리자). */
export function ProjectRoleLabel({ role, className }: { role: ProjectRole; className?: string }) {
  const RoleIcon = PROJECT_ROLE_ICON[role];
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1 text-muted-foreground', className)}>
      <RoleIcon className="size-3.5 text-icon-muted" />
      {PROJECT_ROLE_LABEL[role]}
    </span>
  );
}
