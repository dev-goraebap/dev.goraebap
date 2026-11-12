import { useCurrentProject } from "@/entities/project"
import { paths, projectPath } from "@/shared/config"
import { FolderWithFilesIcon, ProjectsIcon } from "@/shared/ui/icon"
import { Page } from "@/shared/ui/page"
import { PageState } from "@/shared/ui/page-state"

/** 프로젝트의 문서(자리만 잡은 페이지). */
export function ProjectDocumentsPage() {
  const { key, project } = useCurrentProject()
  return (
    <Page crumbs={[{ label: "프로젝트", href: paths.projects }, { label: project?.name ?? key, icon: ProjectsIcon, href: projectPath(key) }, { label: "문서", icon: FolderWithFilesIcon }]}>
      <PageState kind="empty" title="문서을 준비하고 있습니다" />
    </Page>
  )
}
