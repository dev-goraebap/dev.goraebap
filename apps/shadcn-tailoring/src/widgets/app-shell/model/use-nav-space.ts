import { useRouterState } from "@tanstack/react-router"
import { useProject } from "@/entities/project"
import { currentEntry, projectKeyOf, spaceOf } from "./nav"

/** 지금 주소의 메뉴 구역과 그 안의 지금 항목. 프로젝트 안이면 그 이름을 읽어 제목으로 쓴다. */
export function useNavSpace() {
  const pathname = useRouterState({ select: state => state.location.pathname })
  const projectKey = projectKeyOf(pathname)
  const { data: project } = useProject(projectKey ?? "")
  const space = spaceOf(pathname, projectKey ? project?.name : undefined)
  return { pathname, space, current: currentEntry(space, pathname), project: projectKey ? project ?? undefined : undefined }
}
