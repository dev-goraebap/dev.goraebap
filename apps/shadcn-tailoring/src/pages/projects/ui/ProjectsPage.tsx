import { ProjectsIcon } from "@/shared/ui/icon"
import { Page } from "@/shared/ui/page"

/** 프로젝트. 화면은 다음 단계에서 채운다. */
export function ProjectsPage() {
  return <Page crumbs={[{ label: "프로젝트", icon: ProjectsIcon }]}>{null}</Page>
}
