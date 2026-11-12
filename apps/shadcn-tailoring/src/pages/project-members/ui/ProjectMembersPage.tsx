import { useCurrentProject } from "@/entities/project"
import { paths, projectPath } from "@/shared/config"
import { UsersIcon, ProjectsIcon } from "@/shared/ui/icon"
import { Page } from "@/shared/ui/page"
import { PageState } from "@/shared/ui/page-state"

/** 프로젝트의 멤버(자리만 잡은 페이지). */
export function ProjectMembersPage() {
  const { key, project } = useCurrentProject()
  return (
    <Page crumbs={[{ label: "프로젝트", href: paths.projects }, { label: project?.name ?? key, icon: ProjectsIcon, href: projectPath(key) }, { label: "멤버", icon: UsersIcon }]}>
      <PageState kind="empty" title="멤버을 준비하고 있습니다" />
    </Page>
  )
}
