import { useQuery } from '@tanstack/react-query';
import { projectOptions, useIsWorkspaceAdmin } from '@/entities/project';
import { PageState } from '@/shared/ui/kit/page-state';
import { SettingsPage } from '@/shared/ui/kit/settings';
import { pageCrumbs } from '@/shared/ui/nav-icon';
import { ProjectDangerZone } from './ProjectDangerZone';
import { ProjectGeneralForm } from './ProjectGeneralForm';

type Crumb = { label: string; href?: string; icon?: string };

/**
 * A project's 설정 · 일반, for Workspace administrators (client/'s ProjectSettingsPage): its mark, name, key and description
 * saved together over the version the draft started from, and under them the danger zone. Read only while archived or
 * deleted.
 */
export function ProjectGeneralPage({ crumbs, projectKey }: { crumbs: Crumb[]; projectKey: string }) {
  const project = useQuery(projectOptions(projectKey));
  const isWorkspaceAdmin = useIsWorkspaceAdmin();
  const page = { crumbs: pageCrumbs(crumbs), title: '일반' };
  if (project.isError) return <SettingsPage {...page}>
    <PageState kind="error" isCompact title="프로젝트를 불러오지 못했습니다" description={project.error.message} />
  </SettingsPage>;
  if (!project.data) return <SettingsPage {...page}>{null}</SettingsPage>;
  return <SettingsPage {...page}>
    {/* The draft starts from the project once; a change heard from elsewhere does not overwrite what is being typed. */}
    <ProjectGeneralForm key={project.data.id} project={project.data} />
    {/* 보관 · 삭제 · 되살리기는 워크스페이스 관리자만(프로젝트 관리자는 이름 · 설명 · 표식까지). */}
    {isWorkspaceAdmin ? <ProjectDangerZone project={project.data} /> : null}
  </SettingsPage>;
}
