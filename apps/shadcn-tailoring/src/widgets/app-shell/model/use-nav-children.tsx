import { useRouterState } from "@tanstack/react-router"
import { useDocumentLibrary } from "@/entities/document"
import { ALL_VIEW, WORK_ITEM_VIEWS } from "@/entities/work-item"
import { ProjectMark, useProjects } from "@/entities/project"
import { paths, projectPath } from "@/shared/config"
import { ListFilterIcon, ProjectsIcon } from "@/shared/ui/icon"
import { projectKeyOf, type NavChild, type NavEntry } from "./nav"

/**
 * 메뉴 항목 아래 줄을 돌려주는 함수(호호코워크 AuthLayout의 workItemNavigation · documentNavigation, AppFrame의 childrenOf).
 * 프로젝트 → 별표한 활성 프로젝트(각 줄은 그 프로젝트의 업무), 프로젝트의 업무 → 업무 뷰, 문서 → 저장한 뷰.
 * 뷰 줄은 주소가 그 페이지이고 ?view가 같을 때 지금 자리다(호호코워크 selected).
 */
export function useNavChildren(): (entry: NavEntry) => NavChild[] {
  const { pathname, view } = useRouterState({
    select: state => ({ pathname: state.location.pathname, view: (state.location.search as Record<string, unknown>).view }),
  })
  const projectKey = projectKeyOf(pathname)
  const projects = useProjects().data
  const library = useDocumentLibrary(projectKey ?? "").data
  const viewRow = (path: string, id: string, label: string, icon: NavChild["icon"]): NavChild =>
    ({ key: id, path, search: { view: id }, label, icon, isCurrent: pathname === path && view === id })

  return entry => {
    if (entry.path === paths.projects) {
      return (projects ?? []).filter(project => project.starred && project.status === "active").map(project => ({
        key: project.key, path: projectPath(project.slug), label: project.name, icon: ProjectsIcon, isCurrent: false,
        media: <ProjectMark icon={project.icon} color={project.color} size="sm" />,
      }))
    }
    if (!projectKey) return []
    if (entry.path === projectPath(projectKey, "work-items")) // 기본인 전체 업무는 업무 자체가 연다(호호코워크와 같이 줄에서 뺀다).
      return WORK_ITEM_VIEWS.filter(each => each.value !== ALL_VIEW).map(each => viewRow(entry.path, each.value, each.label, each.icon))
    if (entry.path === projectPath(projectKey, "documents")) return (library?.views ?? []).map(each => viewRow(entry.path, each.id, each.name, ListFilterIcon))
    return []
  }
}
