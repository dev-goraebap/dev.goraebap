import type { ReactNode } from "react"
import { useCurrentProject } from "@/entities/project"
import { paths, projectPath } from "@/shared/config"
import { ProjectsIcon, type Icon } from "@/shared/ui/icon"
import { Page } from "@/shared/ui/page"

/** 프로젝트 설정 한 쪽의 페이지 틀: 경로 프로젝트 › 이름 › 관리 쪽 이름. */
export function ProjectSettingsFrame({ label, icon, children }: { label: string; icon: Icon; children: ReactNode }) {
  const { key, project } = useCurrentProject()
  return (
    <Page crumbs={[{ label: "프로젝트", href: paths.projects }, { label: project?.name ?? key, icon: ProjectsIcon, href: projectPath(key) }, { label, icon }]}>
      {children}
    </Page>
  )
}
