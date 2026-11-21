import { useNavigate } from '@tanstack/react-router';
import type { Project, ProjectChange, ProjectStatus } from '@/entities/project';
import { ActionMenu, type MenuAction } from '@/shared/ui/kit/action-menu';
import { ArchiveIcon, ArchiveUpIcon, RestoreIcon, SettingsIcon, Trash2Icon } from '@/shared/ui/kit/icon';

/** A row's … for Workspace administrators: what the tab allows (설정, 보관 or 보관 해제, 삭제; 되살리기 in 삭제됨). */
export function ProjectRowMenu({ project, status, onChange }: { project: Project; status: ProjectStatus; onChange: (change: ProjectChange) => void }) {
  const navigate = useNavigate();
  const actions: MenuAction[] = status === 'DELETED'
    ? [{ label: '되살리기', icon: RestoreIcon, onSelect: () => onChange('restore') }]
    : [
      { label: '설정', icon: SettingsIcon, onSelect: () => void navigate({ href: `/workspace/projects/${project.key}/settings/general` }) },
      status === 'ARCHIVED'
        ? { label: '보관 해제', icon: ArchiveUpIcon, onSelect: () => onChange('unarchive') }
        : { label: '보관', icon: ArchiveIcon, onSelect: () => onChange('archive') },
      { label: '삭제', icon: Trash2Icon, onSelect: () => onChange('delete') },
    ];
  // The row is a link (RowLink covers it); the menu is raised over that cover so it opens on its own.
  return <span className="relative z-1 flex"><ActionMenu label={`${project.name} 관리`} title={project.name} size="row" actions={actions} /></span>;
}
