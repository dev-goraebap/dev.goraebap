import { Link } from '@tanstack/react-router';
import { ProjectRoleLabel } from '@/entities/project';
import { MarkIcon, markTone } from '@/shared/ui/mark-picker';
import type { JoinedProject } from '../model/member-row';

/** 프로젝트 하나: 그 표식(아이콘 · 색)과 이름, 그 안의 역할. 누르면 그 프로젝트의 업무로. */
export function MemberProjectChip({ joined: { project, role } }: { joined: JoinedProject }) {
  return (
    <Link to="/workspace/projects/$key/work-items" params={{ key: project.key }}
      className="relative z-1 flex h-6 max-w-44 min-w-0 shrink-0 items-center gap-1.5 rounded-md bg-muted px-2 text-xs text-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
      {/* check-ui: allow-style 프로젝트 표식의 색은 관리자가 고른 데이터다. */}
      <span style={markTone(project.color)} className="flex text-(--mark,currentColor) [&_svg]:size-3.5"><MarkIcon name={project.icon ?? 'projects'} /></span>
      <span className="truncate">{project.name}</span>
      <ProjectRoleLabel role={role} />
    </Link>
  );
}
